import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return new NextResponse("Phone and message are required", { status: 400 });
    }

    // Buscar workspace para obter credenciais de WhatsApp
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) return new NextResponse("Workspace not found", { status: 404 });

    // Se tiver Evolution API configurada, tenta enviar mensagem real
    if (workspace.whatsappUrl && workspace.whatsappApiKey && workspace.whatsappInstance) {
      try {
        await axios.post(`${workspace.whatsappUrl}/message/sendText/${workspace.whatsappInstance}`, {
          number: phone,
          text: message
        }, {
          headers: { "apikey": workspace.whatsappApiKey }
        });
      } catch (waError) {
        console.error("FAILED_TO_SEND_WHATSAPP", waError);
        // Mesmo se falhar o envio real, vamos registrar no banco
      }
    }

    // Registrar na conversa (mesma lógica do webhook)
    let conversation = await prisma.aIConversation.findFirst({
      where: { workspaceId, phone },
      orderBy: { updatedAt: "desc" }
    });

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: { 
          workspaceId,
          phone,
          title: `Conversa com ${phone}`
        }
      });
    }

    const newMessage = await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user", // Representando o usuário do CRM enviando
        content: message,
        metadata: { phone, sentBy: "crm_user" }
      }
    });

    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("AI_CHAT_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
