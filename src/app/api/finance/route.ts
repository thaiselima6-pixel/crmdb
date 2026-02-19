import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parse, isValid } from "date-fns";

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

    const serializedInvoices = invoices.map((invoice: any) => ({
      ...invoice,
      amount:
        invoice.amount !== null && invoice.amount !== undefined
          ? Number(invoice.amount)
          : 0,
    }));

    const mrrValue =
      monthlyRevenue._sum.amount !== null &&
      monthlyRevenue._sum.amount !== undefined
        ? Number(monthlyRevenue._sum.amount)
        : 0;

    return NextResponse.json({
      invoices: serializedInvoices,
      mrr: mrrValue,
      templates: workspace,
    });
  } catch (error: any) {
    console.error("FINANCE_GET", error);
    return NextResponse.json(
      {
        message: "Erro ao carregar informações financeiras.",
        detail: error?.message || null,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { amount, status, dueDate, clientId, projectId, description } = body;

    if (!clientId) {
      return NextResponse.json(
        { message: "Cliente é obrigatório para criar uma fatura." },
        { status: 400 }
      );
    }

    if (!amount && amount !== 0) {
      return NextResponse.json(
        { message: "Valor da fatura é obrigatório." },
        { status: 400 }
      );
    }

    const normalizedAmount =
      typeof amount === "string"
        ? Number(amount.replace(/\./g, "").replace(",", "."))
        : Number(amount);

    if (Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      return NextResponse.json(
        { message: "Valor da fatura inválido." },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { message: "Data de vencimento é obrigatória." },
        { status: 400 }
      );
    }

    let parsedDueDate: Date;
    if (typeof dueDate === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(dueDate)) {
      const d = parse(dueDate, "dd/MM/yyyy", new Date());
      if (!isValid(d)) {
        return NextResponse.json(
          { message: "Data de vencimento inválida. Use dd/MM/yyyy ou YYYY-MM-DD." },
          { status: 400 }
        );
      }
      parsedDueDate = d;
    } else {
      const d = new Date(dueDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { message: "Data de vencimento inválida. Use dd/MM/yyyy ou YYYY-MM-DD." },
          { status: 400 }
        );
      }
      parsedDueDate = d;
    }

    const invoice = await prisma.invoice.create({
      data: {
        amount: normalizedAmount,
        status: status || "PENDING",
        dueDate: parsedDueDate,
        clientId,
        projectId: projectId || null,
        description,
        workspaceId,
      },
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("FINANCE_POST", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            message:
              "Não foi possível criar a fatura. Cliente ou projeto inválido.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Erro ao criar fatura. Tente novamente.",
        detail: error?.message || null,
        code: (error as any)?.code || null,
        meta: (error as any)?.meta || null,
      },
      { status: 500 }
    );
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
