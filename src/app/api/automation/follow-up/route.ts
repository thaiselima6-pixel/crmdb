import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const now = new Date();

    // 1. Leads without contact for 7 days
    const sevenDaysAgo = subDays(now, 7);
    const staleLeads = await prisma.lead.findMany({
      where: {
        workspaceId,
        status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
        updatedAt: { lte: sevenDaysAgo }
      },
      select: { id: true, name: true, phone: true, status: true, updatedAt: true }
    });

    // 2. Proposals sent but not accepted/rejected for 3 days
    const threeDaysAgo = subDays(now, 3);
    const staleProposals = await prisma.proposal.findMany({
      where: {
        workspaceId,
        status: "SENT",
        updatedAt: { lte: threeDaysAgo }
      },
      select: { id: true, title: true, clientName: true, clientEmail: true, updatedAt: true, value: true }
    });

    // 3. Invoices pending and due in 3 days
    const inThreeDays = new Date();
    inThreeDays.setDate(now.getDate() + 3);
    const upcomingInvoices = await prisma.invoice.findMany({
      where: {
        workspaceId,
        status: "PENDING",
        dueDate: { lte: inThreeDays, gte: now }
      },
      include: { client: { select: { name: true, phone: true } } }
    });

    const alerts = [
      ...staleLeads.map(l => ({
        id: `lead-${l.id}`,
        type: "LEAD_STALE",
        title: l.name,
        description: `Lead sem contato há ${Math.floor((now.getTime() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60 * 24))} dias`,
        data: l,
        severity: "high"
      })),
      ...staleProposals.map(p => ({
        id: `proposal-${p.id}`,
        type: "PROPOSAL_STALE",
        title: p.clientName,
        description: `Proposta "${p.title}" enviada há 3+ dias sem resposta`,
        data: p,
        severity: "medium"
      })),
      ...upcomingInvoices.map(i => ({
        id: `invoice-${i.id}`,
        type: "INVOICE_DUE",
        title: i.client.name,
        description: `Vencimento em 3 dias: R$ ${Number(i.amount).toLocaleString('pt-BR')}`,
        data: i,
        severity: "high"
      }))
    ];

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("AUTOMATION_ALERTS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
