import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WhatsAppService } from "@/lib/whatsapp";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Extrai telefone e texto de diferentes formatos de payload do UazAPI e Evolution API.
 *
 * UazAPI v2 formato típico:
 * { type: "messages", data: { key: { remoteJid, fromMe }, body, pushName, messageType } }
 *
 * Evolution API formato:
 * { event: "messages.upsert", data: { key: { remoteJid, fromMe }, message: { conversation }, pushName } }
 */
function parseWebhookPayload(body: any): {
  phone: string | null;
  text: string | null;
  pushName: string | null;
  fromMe: boolean;
  isGroup: boolean;
} {
  // Normaliza o data
  const data = body.data || body;

  // fromMe — UazAPI usa data.key.fromMe ou data.fromMe
  const fromMe =
    data?.key?.fromMe === true ||
    data?.fromMe === true ||
    body?.fromMe === true;

  // Número remetente — tenta vários campos
  const remoteJid: string =
    data?.key?.remoteJid ||
    data?.from ||
    data?.remoteJid ||
    body?.from ||
    "";

  const isGroup = remoteJid.includes("@g.us");

  const rawPhone = remoteJid
    .replace(/@s\.whatsapp\.net$/, "")
    .replace(/@.*$/, "")
    .replace(/\D/g, "");

  // Texto da mensagem — UazAPI usa data.body; Evolution usa data.message.conversation
  const text: string | null =
    data?.body ||
    data?.message?.conversation ||
    data?.message?.extendedTextMessage?.text ||
    data?.text ||
    body?.body ||
    null;

  const pushName: string | null =
    data?.pushName || data?.senderName || body?.pushName || null;

  return {
    phone: rawPhone || null,
    text,
    pushName,
    fromMe,
    isGroup,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log para depuração (remova depois de confirmar o formato)
    console.log("WEBHOOK_WHATSAPP_PAYLOAD", JSON.stringify(body).substring(0, 500));

    const { phone, text, pushName, fromMe, isGroup } = parseWebhookPayload(body);

    // Ignorar próprias mensagens e grupos
    if (fromMe) return NextResponse.json({ ignored: true, reason: "fromMe" });
    if (isGroup) return NextResponse.json({ ignored: true, reason: "group" });
    if (!phone || !text) return NextResponse.json({ ignored: true, reason: "no_text_or_phone" });

    // No UazAPI não há conceito de instância por payload — identificamos o workspace
    // pelo Token do header (que é o whatsappApiKey registrado no workspace)
    // OU buscamos o único workspace com whatsappUrl configurada (multi-tenant: pega pelo apiKey)
    const authToken =
      req.headers.get("token") ||
      req.headers.get("Token") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    const workspace = await prisma.workspace.findFirst({
      where: authToken
        ? { whatsappApiKey: authToken }
        : { mayaEnabled: true },
      select: {
        id: true,
        name: true,
        mayaEnabled: true,
        mayaSystemPrompt: true,
        whatsappUrl: true,
        whatsappApiKey: true,
      },
    });

    if (!workspace) {
      console.warn("WEBHOOK_WHATSAPP: workspace não encontrado para token", authToken?.substring(0, 8));
      return NextResponse.json({ ignored: true, reason: "workspace_not_found" });
    }

    // Registrar mensagem recebida
    let conversation = await prisma.aIConversation.findFirst({
      where: { workspaceId: workspace.id, phone },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          workspaceId: workspace.id,
          phone,
          title: `${pushName || phone} (${phone})`,
        },
      });
    }

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: text,
        metadata: { phone, pushName },
      },
    });

    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Se Maya não estiver ativa, apenas registra
    if (!workspace.mayaEnabled) {
      return NextResponse.json({ received: true, maya: false });
    }

    // Buscar histórico recente
    const recentMessages = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    recentMessages.reverse();

    // Contexto do contato
    const [lead, client] = await Promise.all([
      prisma.lead.findFirst({
        where: { phone, workspaceId: workspace.id },
        select: { name: true, status: true, company: true },
      }),
      prisma.client.findFirst({
        where: { phone, workspaceId: workspace.id },
        select: { name: true, status: true, company: true, mrr: true },
      }),
    ]);

    const contactName = client?.name || lead?.name || pushName || "Visitante";
    const contactType = client ? "cliente" : lead ? "lead" : "novo contato";

    const DEFAULT_SYSTEM_PROMPT = `Você é Maya, assistente virtual da ${workspace.name}.
Seja simpática, profissional e objetiva. Sempre responda em português.
Quando alguém demonstrar interesse em serviços, colete: nome, empresa e necessidade principal.
Informe que um especialista da equipe entrará em contato em breve para apresentar uma proposta.
Nunca invente preços ou prometa resultados específicos.
Mantenha respostas curtas e naturais, como numa conversa real de WhatsApp.`;

    const systemPrompt = workspace.mayaSystemPrompt || DEFAULT_SYSTEM_PROMPT;

    const contactContext = `\n\n[Contexto interno — não mencione ao usuário]
Contato: ${contactName} | Tipo: ${contactType}
${client ? `MRR: R$ ${Number(client.mrr).toLocaleString("pt-BR")}` : ""}
${lead ? `Status no funil: ${lead.status}` : ""}`;

    const messageHistory: Anthropic.MessageParam[] = recentMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt + contactContext,
      messages: messageHistory,
    });

    const replyText =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : null;

    if (!replyText) {
      return NextResponse.json({ received: true, maya: true, replied: false });
    }

    await WhatsAppService.sendMessage(workspace.id, phone, replyText);

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: replyText,
        metadata: { generatedBy: "maya", model: "claude-haiku" },
      },
    });

    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ received: true, maya: true, replied: true });
  } catch (error) {
    console.error("WEBHOOK_WHATSAPP_ERROR", error);
    // Sempre retornar 200 para evitar reenvios
    return NextResponse.json({ error: "internal_error" });
  }
}
