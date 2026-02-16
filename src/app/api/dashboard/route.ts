import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths, endOfMonth, eachMonthOfInterval, format } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    // 1. KPIs Principais
    // MRR Atual (Soma de faturas pagas no mês atual ou mrr dos clientes ativos)
    const activeClients = await prisma.client.findMany({
      where: { workspaceId, status: "ACTIVE" },
      select: { mrr: true }
    });
    const mrrTotal = activeClients.reduce((acc, client) => acc + Number(client.mrr || 0), 0);

    // Novos Clientes (mês atual)
    const monthStart = startOfMonth(new Date());
    const newClientsCount = await prisma.client.count({
      where: { workspaceId, createdAt: { gte: monthStart } }
    });

    // Taxa de Conversão (Leads WON / Total Leads)
    const totalLeads = await prisma.lead.count({ where: { workspaceId } });
    const wonLeads = await prisma.lead.count({ where: { workspaceId, status: "WON" } });
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    // Projetos Atrasados (Data final menor que hoje e não concluídos)
    const overdueProjectsCount = await prisma.project.count({
      where: { 
        workspaceId, 
        status: { notIn: ["COMPLETED"] },
        endDate: { lt: new Date() }
      }
    });

    // 2. Gráfico MRR (últimos 6 meses)
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    const mrrHistory = await Promise.all(last6Months.map(async (date) => {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthlyRevenue = await prisma.invoice.aggregate({
        where: { 
          workspaceId, 
          status: "PAID",
          dueDate: { gte: start, lte: end }
        },
        _sum: { amount: true }
      });

      return {
        month: format(date, "MMM"),
        amount: Number(monthlyRevenue._sum.amount || 0)
      };
    }));

    // 3. Lista de Tarefas Hoje
    const todayTasks = await prisma.task.findMany({
      where: {
        project: { workspaceId },
        status: { not: "COMPLETED" },
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      },
      include: { project: { select: { name: true } } },
      take: 5
    });

    // 4. Próximos Vencimentos (próximos 3 dias)
    const nextInvoices = await prisma.invoice.findMany({
      where: {
        workspaceId,
        status: "PENDING",
        dueDate: {
          gte: new Date(),
          lte: new Date(new Date().setDate(new Date().getDate() + 3))
        }
      },
      include: { client: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5
    });

    return NextResponse.json({
      kpis: {
        mrr: mrrTotal,
        newClients: newClientsCount,
        conversionRate: conversionRate.toFixed(1),
        overdueProjects: overdueProjectsCount
      },
      mrrHistory,
      todayTasks,
      nextInvoices
    });

  } catch (error) {
    console.error("DASHBOARD_API_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
