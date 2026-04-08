import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { whatsappUrl: true, whatsappApiKey: true, whatsappInstance: true },
    });

    const evoUrl = workspace?.whatsappUrl || process.env.EVOLUTION_API_URL;
    const evoKey = workspace?.whatsappApiKey || process.env.EVOLUTION_API_KEY;
    const evoInstance = workspace?.whatsappInstance || process.env.EVOLUTION_INSTANCE || "digitalbrainmkt";

    if (!evoUrl || !evoKey) {
      return NextResponse.json({ error: "Evolution API não configurada. Vá em Integrações e configure." }, { status: 400 });
    }

    const base = evoUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/chat/findChats/${evoInstance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({ where: {} }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("EVO_CHATS_ERROR", text);
      return NextResponse.json({ error: "Erro ao buscar conversas da Evolution API" }, { status: 502 });
    }

    const chats = await res.json();
    return NextResponse.json(Array.isArray(chats) ? chats : []);
  } catch (error) {
    console.error("WHATSAPP_CHATS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
