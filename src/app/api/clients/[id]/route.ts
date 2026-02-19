import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse, isValid } from "date-fns";

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = params;
    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { name, email, company, phone, logo, mrr, billingDay, startDate } = body;

    if (!name || String(name).trim().length < 2) {
      return NextResponse.json(
        { message: "Nome do cliente é obrigatório e deve ter ao menos 2 caracteres." },
        { status: 400 }
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json(
        { message: "E-mail inválido. Verifique o endereço informado." },
        { status: 400 }
      );
    }
    const sanitizedPhone = phone ? String(phone).replace(/\D/g, "") : undefined;
    const parsedBillingDay =
      billingDay !== undefined && billingDay !== null && billingDay !== ""
        ? Number(billingDay)
        : undefined;
    if (parsedBillingDay !== undefined && (parsedBillingDay < 1 || parsedBillingDay > 31)) {
      return NextResponse.json(
        { message: "Dia de vencimento deve estar entre 1 e 31." },
        { status: 400 }
      );
    }
    const parsedMrr =
      mrr !== undefined && mrr !== null && mrr !== ""
        ? Number(mrr)
        : undefined;
    if (parsedMrr !== undefined && Number.isNaN(parsedMrr)) {
      return NextResponse.json(
        { message: "MRR inválido." },
        { status: 400 }
      );
    }
    let parsedStartDate: Date | undefined = undefined;
    if (startDate) {
      if (typeof startDate === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(startDate)) {
        const d = parse(startDate, "dd/MM/yyyy", new Date());
        if (!isValid(d)) {
          return NextResponse.json(
            { message: "Data de entrada inválida. Use dd/MM/yyyy ou YYYY-MM-DD." },
            { status: 400 }
          );
        }
        parsedStartDate = d;
      } else {
        const d = new Date(startDate);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json(
            { message: "Data de entrada inválida. Use dd/MM/yyyy ou YYYY-MM-DD." },
            { status: 400 }
          );
        }
        parsedStartDate = d;
      }
    }

    const client = await prisma.client.update({
      where: { 
        id,
        workspaceId 
      },
      data: { 
        name, 
        email: email === "" ? undefined : email,
        company, 
        phone: sanitizedPhone || null,
        logo,
        mrr: parsedMrr,
        billingDay: parsedBillingDay,
        startDate: parsedStartDate,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("CLIENT_PATCH", error);
    return NextResponse.json(
      { message: "Erro ao atualizar cliente. Tente novamente." },
      { status: 500 }
    );
  }
}
