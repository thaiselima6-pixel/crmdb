import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const workspaceId = (session.user as any).workspaceId;
    const { id } = await params;

    await prisma.expense.deleteMany({ where: { id, workspaceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EXPENSE_DELETE", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const workspaceId = (session.user as any).workspaceId;
    const { id } = await params;
    const body = await req.json();

    const expense = await prisma.expense.updateMany({
      where: { id, workspaceId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        ...(body.category && { category: body.category }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.recurring !== undefined && { recurring: !!body.recurring }),
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("EXPENSE_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
