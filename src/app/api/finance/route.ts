import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    
    // Buscar faturas (receitas)
    const invoices = await prisma.invoice.findMany({
      where: { workspaceId },
      include: { client: true, project: true },
      orderBy: { createdAt: "desc" },
    });

    // Buscar Workspace para templates
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        reminderTemplateUpcoming: true,
        reminderTemplateOverdue: true,
      }
    });

    // Calcular MRR (Soma de faturas recorrentes ou pagas no mês atual)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        workspaceId,
        status: "PAID",
        dueDate: {
          gte: firstDayOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      invoices,
      mrr: monthlyRevenue._sum.amount || 0,
      templates: workspace,
    });
  } catch (error) {
    console.error("FINANCE_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { amount, status, dueDate, clientId, projectId, description } = body;

    const invoice = await prisma.invoice.create({
      data: {
        amount: parseFloat(amount),
        status: status || "PENDING",
        dueDate: new Date(dueDate),
        clientId,
        projectId,
        description,
        workspaceId,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("FINANCE_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { reminderTemplateUpcoming, reminderTemplateOverdue } = body;

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        reminderTemplateUpcoming,
        reminderTemplateOverdue,
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("FINANCE_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
