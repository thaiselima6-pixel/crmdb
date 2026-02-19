import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse, isValid } from "date-fns";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const rows = await prisma.client.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        status: true,
        mrr: true,
        billingDay: true,
        startDate: true,
        createdAt: true,
        updatedAt: true,
        logo: true,
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            budget: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const clients = rows.map((c: any) => ({
      ...c,
      mrr: c.mrr !== null && c.mrr !== undefined ? Number(c.mrr) : 0,
      projects: (c.projects || []).map((p: any) => ({
        ...p,
        budget: p.budget !== null && p.budget !== undefined ? Number(p.budget) : 0,
      })),
    }));

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("CLIENTS_GET", error);
    return NextResponse.json(
      { message: "Erro ao carregar clientes.", detail: error?.message || null },
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
    const { name, email, company, phone, logo, mrr, billingDay, startDate } = body;

    // Validações básicas
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

    const sanitizedPhone = phone ? String(phone).replace(/\D/g, "") : "";
    if (!sanitizedPhone || sanitizedPhone.length < 10) {
      return NextResponse.json(
        { message: "Telefone é obrigatório e deve conter ao menos 10 dígitos." },
        { status: 400 }
      );
    }
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

    const fallbackEmail = `${sanitizedPhone || "semphone"}-${Date.now()}@noemail.local`;
    const client = await prisma.client.create({
      data: { 
        name, 
        email: email || fallbackEmail,
        company,
        phone: sanitizedPhone,
        logo, 
        workspaceId,
        mrr: parsedMrr,
        billingDay: parsedBillingDay,
        startDate: parsedStartDate,
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("CLIENTS_POST", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const target = (error.meta as any)?.target;
      const isEmailUniqueViolation =
        error.code === "P2002" &&
        (target === "Client_email_key" ||
          target === "email" ||
          (Array.isArray(target) && target.includes("email")));

      if (isEmailUniqueViolation) {
        return NextResponse.json(
          { message: "Já existe um cliente cadastrado com este e-mail." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        message: "Erro ao cadastrar cliente. Tente novamente.", 
        detail: error?.message || null,
        code: error?.code || null,
        meta: error?.meta || null
      },
      { status: 500 }
    );
  }
}
