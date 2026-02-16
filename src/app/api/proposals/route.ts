import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    const proposals = await prisma.proposal.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("PROPOSALS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { title, value, clientName, clientEmail, content } = body;

    if (!title || value === undefined || value === null || !clientName || !clientEmail || !content) {
      console.log("Missing fields:", { title, value, clientName, clientEmail, content: !!content });
      return new NextResponse("Campos obrigatórios ausentes", { status: 400 });
    }

    const proposal = await prisma.proposal.create({
      data: {
        title,
        value,
        clientName,
        clientEmail,
        content,
        workspaceId,
        status: "SENT"
      }
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("PROPOSALS_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
