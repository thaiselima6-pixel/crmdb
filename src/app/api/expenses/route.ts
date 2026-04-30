import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const workspaceId = (session.user as any).workspaceId;

    const expenses = await prisma.expense.findMany({
      where: { workspaceId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(
      expenses.map((e) => ({ ...e, amount: Number(e.amount) }))
    );
  } catch (error) {
    console.error("EXPENSES_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const workspaceId = (session.user as any).workspaceId;

    const { name, amount, category, date, recurring } = await req.json();

    if (!name || !amount || !date) {
      return NextResponse.json({ message: "Nome, valor e data são obrigatórios." }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        name,
        amount: Number(amount),
        category: category || "outros",
        date: new Date(date),
        recurring: !!recurring,
        workspaceId,
      },
    });

    return NextResponse.json({ ...expense, amount: Number(expense.amount) });
  } catch (error) {
    console.error("EXPENSES_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
