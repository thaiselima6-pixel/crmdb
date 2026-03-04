import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    const conversations = await prisma.aIConversation.findMany({
      where: { 
        workspaceId,
        ...(phone ? { phone } : {})
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("AI_CONVERSATIONS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
