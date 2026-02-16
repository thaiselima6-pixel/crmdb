import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint para a Assistente Virtual (Maya) consultar dados do CRM e registrar logs
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = req.headers.get("x-api-key");

    if (apiKey !== process.env.N8N_API_KEY) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, workspaceId, phone, content, role } = body;

    if (!workspaceId) {
      return new NextResponse("workspaceId is required", { status: 400 });
    }

    // Ação 1: Buscar contexto do cliente/lead pelo telefone
    if (action === "get_context") {
      const lead = await prisma.lead.findFirst({
        where: { phone, workspaceId },
        select: { name: true, status: true, tags: true, company: true }
      });

      const client = await prisma.client.findFirst({
        where: { phone, workspaceId },
        select: { name: true, status: true, company: true, mrr: true }
      });

      // Buscar serviços/projetos ativos para este workspace para a IA saber o que oferecer
      const services = await prisma.project.findMany({
        where: { workspaceId },
        take: 5,
        select: { name: true, description: true }
      });

      return NextResponse.json({
        exists: !!(lead || client),
        type: client ? "CLIENT" : (lead ? "LEAD" : "NONE"),
        data: client || lead || null,
        availableServices: services
      });
    }

    // Ação 2: Registrar log de conversa da assistente
    if (action === "log_chat") {
      if (!phone || !content || !role) {
        return new NextResponse("phone, content and role are required for logging", { status: 400 });
      }

      // Buscar ou criar conversa para este telefone no workspace
      let conversation = await prisma.aIConversation.findFirst({
        where: { workspaceId }, // Poderíamos adicionar um campo de telefone na conversa se quisermos separar por chat
        orderBy: { updatedAt: "desc" }
      });

      if (!conversation) {
        conversation = await prisma.aIConversation.create({
          data: { workspaceId }
        });
      }

      await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: role, // 'user' ou 'assistant'
          content: content,
          metadata: { phone }
        }
      });

      return NextResponse.json({ success: true });
    }

    return new NextResponse("Invalid action", { status: 400 });

  } catch (error) {
    console.error("WEBHOOK_ANA_ASSISTENTE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
