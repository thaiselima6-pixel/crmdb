import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { searchParams } = new URL(req.url);
    const remoteJid = searchParams.get("remoteJid");

    if (!remoteJid) return new NextResponse("remoteJid required", { status: 400 });

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
    const res = await fetch(`${base}/chat/findMessages/${evoInstance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        where: { key: { remoteJid } },
        limit: 50,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("EVO_MESSAGES_ERROR", text);
      return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 502 });
    }

    const data = await res.json();
    const messages = Array.isArray(data) ? data : data?.messages?.records || [];
    return NextResponse.json(messages);
  } catch (error) {
    console.error("WHATSAPP_MESSAGES_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
