import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parse, isValid } from "date-fns";

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { id } = await params;
    const body = await req.json();

    const invoice = await prisma.invoice.findFirst({
      where: { id, workspaceId },
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body?.description !== undefined) {
      const description = String(body.description || "").trim();
      if (!description) {
        return NextResponse.json({ message: "Descrição da fatura é obrigatória." }, { status: 400 });
      }
      updateData.description = description;
    }

    if (body?.amount !== undefined) {
      const amount = body.amount;
      const normalizedAmount =
        typeof amount === "string"
          ? Number(amount.replace(/\./g, "").replace(",", "."))
          : Number(amount);

      if (Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
        return NextResponse.json({ message: "Valor da fatura inválido." }, { status: 400 });
      }
      updateData.amount = normalizedAmount;
    }

    if (body?.dueDate !== undefined) {
      const dueDate = body.dueDate;
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
      updateData.dueDate = parsedDueDate;
    }

    if (body?.clientId !== undefined) {
      const clientId = String(body.clientId || "").trim();
      if (!clientId) {
        return NextResponse.json({ message: "Cliente é obrigatório para editar uma fatura." }, { status: 400 });
      }
      updateData.clientId = clientId;
    }

    if (body?.projectId !== undefined) {
      const projectId = body.projectId ? String(body.projectId) : null;
      updateData.projectId = projectId || null;
    }

    if (body?.status !== undefined) {
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Nenhum campo para atualizar." }, { status: 400 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { client: true, project: true },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("FINANCE_PUT", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Não foi possível atualizar a fatura. Cliente ou projeto inválido." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Erro ao editar fatura. Tente novamente.",
        detail: error?.message || null,
      },
      { status: 500 }
    );
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
