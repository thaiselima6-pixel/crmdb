import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const invoice = await prisma.invoice.findFirst({
      where: { id, workspaceId }
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("FINANCE_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, workspaceId }
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("FINANCE_DELETE", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
