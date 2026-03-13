import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WhatsAppService } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { webhookUrl } = body;

    if (!webhookUrl) {
      return NextResponse.json({ message: "webhookUrl é obrigatório." }, { status: 400 });
    }

    const result = await WhatsAppService.configureWebhook(workspaceId, webhookUrl);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("CONFIGURE_WEBHOOK_ERROR", error);
    return NextResponse.json(
      { message: error.message || "Erro ao configurar webhook." },
      { status: 500 }
    );
  }
}
