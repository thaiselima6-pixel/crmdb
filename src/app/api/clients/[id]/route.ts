import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const workspaceId = (session.user as any).workspaceId;

    const client = await prisma.client.findUnique({
      where: { 
        id,
        workspaceId 
      },
      include: { 
        projects: {
          orderBy: { createdAt: "desc" }
        },
        invoices: {
          orderBy: { dueDate: "desc" }
        }
      },
    });

    if (!client) return new NextResponse("Not Found", { status: 404 });

    return NextResponse.json(client);
  } catch (error) {
    console.error("CLIENT_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { name, email, company, phone, logo } = body;

    const client = await prisma.client.update({
      where: { 
        id,
        workspaceId 
      },
      data: { name, email, company, phone, logo },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("CLIENT_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
