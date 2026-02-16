import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    const templates = await prisma.proposalTemplate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("TEMPLATES_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { name, content } = body;

    if (!name || !content) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const template = await prisma.proposalTemplate.create({
      data: {
        name,
        content,
        workspaceId
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("TEMPLATES_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
