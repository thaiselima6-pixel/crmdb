import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WhatsAppService } from "@/lib/whatsapp";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Extrai o texto da mensagem de diferentes tipos do Evolution API
function extractMessageText(data: any): string | null {
  const msg = data?.message;
  if (!msg) return null;
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.documentMessage?.caption ||
    null
  );
}

// Remove sufixo @s.whatsapp.net e formata o número
function normalizePhone(remoteJid: string): string {
  return remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/@.*$/, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Evolution API envia diferentes formatos; normalizamos
    const event = body.event || body.type;
    const instanceName = body.instance || body.instanceName;
    const data = body.data || body;

    // Ignorar eventos que não são mensagens recebidas
    if (!["messages.upsert", "message"].includes(event)) {
      return NextResponse.json({ ignored: true });
    }

    // Ignorar mensagens enviadas pelo próprio número
    if (data?.key?.fromMe === true) {
      return NextResponse.json({ ignored: true, reason: "fromMe" });
    }

    const remoteJid: string = data?.key?.remoteJid || "";
    // Ignorar grupos
    if (remoteJid.includes("@g.us")) {
      return NextResponse.json({ ignored: true, reason: "group" });
    }

    const phone = normalizePhone(remoteJid);
    const messageText = extractMessageText(data);

    if (!phone || !messageText) {
      return NextResponse.json({ ignored: true, reason: "no_text" });
    }

    // Encontrar o workspace pela instância do WhatsApp
    const workspace = await prisma.workspace.findFirst({
      where: { whatsappInstance: instanceName },
      select: {
        id: true,
        name: true,
        mayaEnabled: true,
        mayaSystemPrompt: true,
        whatsappUrl: true,
        whatsappApiKey: true,
        whatsappInstance: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ ignored: true, reason: "workspace_not_found" });
    }

    // Registrar mensagem recebida na conversa
    let conversation = await prisma.aIConversation.findFirst({
      where: { workspaceId: workspace.id, phone },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      const pushName: string = data?.pushName || phone;
      conversation = await prisma.aIConversation.create({
        data: {
          workspaceId: workspace.id,
          phone,
          title: `${pushName} (${phone})`,
        },
      });
    }

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: messageText,
        metadata: { phone, pushName: data?.pushName },
      },
    });

    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Se Maya não estiver ativa, apenas registra a mensagem
    if (!workspace.mayaEnabled) {
      return NextResponse.json({ received: true, maya: false });
    }

    // Buscar histórico recente da conversa para contexto
    const recentMessages = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    recentMessages.reverse();

    // Buscar contexto do lead/cliente pelo telefone
    const [lead, client] = await Promise.all([
      prisma.lead.findFirst({
        where: { phone, workspaceId: workspace.id },
        select: { name: true, status: true, company: true, email: true },
      }),
      prisma.client.findFirst({
        where: { phone, workspaceId: workspace.id },
        select: { name: true, status: true, company: true, mrr: true },
      }),
    ]);

    const contactName = client?.name || lead?.name || data?.pushName || "Visitante";
    const contactType = client ? "cliente" : lead ? "lead" : "novo contato";

    const DEFAULT_SYSTEM_PROMPT = `Você é Maya, assistente virtual da ${workspace.name}.
Seja simpática, profissional e objetiva. Sempre responda em português.
Quando alguém demonstrar interesse em serviços, colete: nome, empresa e necessidade principal.
Informe que um especialista da equipe entrará em contato em breve para apresentar uma proposta.
Nunca invente preços ou prometa resultados específicos.
Mantenha respostas curtas e naturais, como numa conversa real de WhatsApp.`;

    const systemPrompt = workspace.mayaSystemPrompt || DEFAULT_SYSTEM_PROMPT;

    // Montar contexto do contato para a IA
    const contactContext = `\n\n[Contexto interno - não mencione ao usuário]
Contato: ${contactName} | Tipo: ${contactType}
${client ? `MRR: R$ ${Number(client.mrr).toLocaleString("pt-BR")}` : ""}
${lead ? `Status no funil: ${lead.status}` : ""}`;

    // Converter histórico para formato Anthropic
    const messageHistory: Anthropic.MessageParam[] = recentMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Gerar resposta da Maya via Claude
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

    // Enviar resposta via Evolution API
    await WhatsAppService.sendMessage(workspace.id, phone, replyText);

    // Registrar resposta da Maya na conversa
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
    // Retornar 200 para evitar reenvios do Evolution API
    return NextResponse.json({ error: "internal_error" });
  }
}
