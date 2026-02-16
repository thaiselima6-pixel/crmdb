import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const clients = await prisma.client.findMany({
      where: { workspaceId },
      include: { projects: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("CLIENTS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { name, email, company, phone, logo } = body;

    const client = await prisma.client.create({
      data: { name, email, company, phone, logo, workspaceId },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("CLIENTS_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
