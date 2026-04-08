import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { number, text } = await req.json();

    if (!number || !text) return new NextResponse("number and text required", { status: 400 });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { whatsappUrl: true, whatsappApiKey: true, whatsappInstance: true },
    });

    const evoUrl = workspace?.whatsappUrl || process.env.EVOLUTION_API_URL;
    const evoKey = workspace?.whatsappApiKey || process.env.EVOLUTION_API_KEY;
    const evoInstance = workspace?.whatsappInstance || process.env.EVOLUTION_INSTANCE || "digitalbrainmkt";

    if (!evoUrl || !evoKey) {
      return NextResponse.json({ error: "Evolution API não configurada." }, { status: 400 });
    }

    const base = evoUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/message/sendText/${evoInstance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({ number, text }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("EVO_SEND_ERROR", errData);
      return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 502 });
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("WHATSAPP_SEND_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
