import { prisma } from "./prisma";
import { WhatsAppService } from "./whatsapp";
import { subMinutes, subHours, subDays } from "date-fns";

export interface CartRecoveryResult {
  cartId: string;
  customerName: string;
  attempt: number;
  status: "sent" | "failed" | "skipped_no_phone";
}

export interface CartRecoveryResponse {
  processed: number;
  attempted: number;
  skippedNoPhone: number;
  expired: number;
  details: CartRecoveryResult[];
  message?: string;
}

const DEFAULT_MSG1 =
  "Olá {{customer_name}}! Vi que você se interessou por *{{product_name}}* mas não concluiu a compra. Ainda está disponível para você! Acesse: {{checkout_link}}";
const DEFAULT_MSG2 =
  "{{customer_name}}, seu acesso ao *{{product_name}}* ainda está reservado! Aproveite antes que expire: {{checkout_link}}";
const DEFAULT_MSG3 =
  "Última chance! {{customer_name}}, o *{{product_name}}* ainda está esperando por você. Não perca esta oportunidade: {{checkout_link}}";

// Janelas de envio em relação ao abandono / última mensagem
const DELAY_MSG1_MINUTES = 30;   // 30min após abandono
const DELAY_MSG2_HOURS = 2;      // 2h após msg1
const DELAY_MSG3_HOURS = 22;     // ~24h após abandono (22h após msg2)
const EXPIRE_DAYS = 3;           // Expira após 3 dias sem conversão

function formatMessage(template: string, cart: {
  customerName: string;
  productName: string;
  productPrice: number;
  checkoutUrl: string | null;
}): string {
  return template
    .replace(/{{customer_name}}/g, cart.customerName)
    .replace(/{{product_name}}/g, cart.productName)
    .replace(/{{product_price}}/g, Number(cart.productPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
    .replace(/{{checkout_link}}/g, cart.checkoutUrl || "")
    .replace(/{{checkout_url}}/g, cart.checkoutUrl || "");
}

export async function processKiwifyRecovery(workspaceId: string): Promise<CartRecoveryResponse> {
  const now = new Date();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      kiwifyEnabled: true,
      kiwifyCartRecoveryEnabled: true,
      kiwifyMsg1Template: true,
      kiwifyMsg2Template: true,
      kiwifyMsg3Template: true,
      whatsappUrl: true,
      whatsappApiKey: true,
    },
  });

  if (!workspace?.kiwifyEnabled || !workspace?.kiwifyCartRecoveryEnabled) {
    return { processed: 0, attempted: 0, skippedNoPhone: 0, expired: 0, details: [], message: "Recuperação Kiwify desativada." };
  }

  if (!workspace.whatsappUrl || !workspace.whatsappApiKey) {
    return { processed: 0, attempted: 0, skippedNoPhone: 0, expired: 0, details: [], message: "WhatsApp não configurado." };
  }

  const msg1Template = workspace.kiwifyMsg1Template || DEFAULT_MSG1;
  const msg2Template = workspace.kiwifyMsg2Template || DEFAULT_MSG2;
  const msg3Template = workspace.kiwifyMsg3Template || DEFAULT_MSG3;

  // Expirar carrinhos antigos
  const expiredCount = await prisma.kiwifyAbandonedCart.updateMany({
    where: {
      workspaceId,
      status: "PENDING",
      abandonedAt: { lt: subDays(now, EXPIRE_DAYS) },
    },
    data: { status: "EXPIRED" },
  });

  // Carrinhos prontos para mensagem 1 (0 tentativas, 30min+ desde abandono)
  const msg1Candidates = await prisma.kiwifyAbandonedCart.findMany({
    where: {
      workspaceId,
      status: "PENDING",
      contactAttempts: 0,
      abandonedAt: { lte: subMinutes(now, DELAY_MSG1_MINUTES) },
    },
  });

  // Carrinhos prontos para mensagem 2 (1 tentativa, 2h+ desde última mensagem)
  const msg2Candidates = await prisma.kiwifyAbandonedCart.findMany({
    where: {
      workspaceId,
      status: "PENDING",
      contactAttempts: 1,
      lastContactAt: { lte: subHours(now, DELAY_MSG2_HOURS) },
    },
  });

  // Carrinhos prontos para mensagem 3 (2 tentativas, 22h+ desde última mensagem)
  const msg3Candidates = await prisma.kiwifyAbandonedCart.findMany({
    where: {
      workspaceId,
      status: "PENDING",
      contactAttempts: 2,
      lastContactAt: { lte: subHours(now, DELAY_MSG3_HOURS) },
    },
  });

  const allCandidates = [
    ...msg1Candidates.map((c) => ({ cart: c, template: msg1Template, attempt: 1 })),
    ...msg2Candidates.map((c) => ({ cart: c, template: msg2Template, attempt: 2 })),
    ...msg3Candidates.map((c) => ({ cart: c, template: msg3Template, attempt: 3 })),
  ];

  if (allCandidates.length === 0) {
    return {
      processed: 0,
      attempted: 0,
      skippedNoPhone: 0,
      expired: expiredCount.count,
      details: [],
      message: "Nenhum carrinho elegível para recuperação agora.",
    };
  }

  const results: CartRecoveryResult[] = [];
  let skippedNoPhone = 0;

  for (const { cart, template, attempt } of allCandidates) {
    if (!cart.customerPhone) {
      skippedNoPhone++;
      results.push({ cartId: cart.id, customerName: cart.customerName, attempt, status: "skipped_no_phone" });
      // Mesmo sem telefone, incrementar tentativas para não ficar em loop
      await prisma.kiwifyAbandonedCart.update({
        where: { id: cart.id },
        data: {
          contactAttempts: { increment: 1 },
          lastContactAt: now,
          // Expirar após 3 tentativas sem telefone
          status: attempt >= 3 ? "EXPIRED" : "PENDING",
        },
      });
      continue;
    }

    try {
      const message = formatMessage(template, {
        customerName: cart.customerName,
        productName: cart.productName,
        productPrice: Number(cart.productPrice),
        checkoutUrl: cart.checkoutUrl,
      });

      await WhatsAppService.sendMessage(workspaceId, cart.customerPhone, message);

      await prisma.kiwifyAbandonedCart.update({
        where: { id: cart.id },
        data: {
          contactAttempts: { increment: 1 },
          lastContactAt: now,
          // Após 3 tentativas sem conversão → expirar
          status: attempt >= 3 ? "EXPIRED" : "PENDING",
        },
      });

      results.push({ cartId: cart.id, customerName: cart.customerName, attempt, status: "sent" });
    } catch {
      results.push({ cartId: cart.id, customerName: cart.customerName, attempt, status: "failed" });
    }
  }

  return {
    processed: results.filter((r) => r.status === "sent").length,
    attempted: allCandidates.length,
    skippedNoPhone,
    expired: expiredCount.count,
    details: results,
  };
}
