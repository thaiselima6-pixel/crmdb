import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const workspaceId = (session.user as any).workspaceId;

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const startOfYear = new Date(year, 0, 1);
    const endOfYear   = new Date(year + 1, 0, 1);

    // Invoices paid in the selected year
    const invoices = await prisma.invoice.findMany({
      where: {
        workspaceId,
        status: "PAID",
        dueDate: { gte: startOfYear, lt: endOfYear },
      },
      select: { amount: true, dueDate: true },
    });

    // All expenses in the selected year (variable = by date, fixed = recurring every month)
    const allExpenses = await prisma.expense.findMany({
      where: { workspaceId },
      select: { amount: true, date: true, recurring: true },
    });

    // Fixed expenses: sum (applied to every month of the year)
    const totalFixed = allExpenses
      .filter((e) => e.recurring)
      .reduce((s, e) => s + Number(e.amount), 0);

    // Variable expenses in this year, bucketed by month
    const variableByMonth: number[] = Array(12).fill(0);
    allExpenses
      .filter((e) => !e.recurring)
      .forEach((e) => {
        const d = new Date(e.date);
        if (d.getFullYear() === year) {
          variableByMonth[d.getMonth()] += Number(e.amount);
        }
      });

    // Revenue bucketed by month
    const revenueByMonth: number[] = Array(12).fill(0);
    invoices.forEach((inv) => {
      const d = new Date(inv.dueDate);
      revenueByMonth[d.getMonth()] += Number(inv.amount);
    });

    // Build monthly rows
    const today = new Date();
    const months = MONTH_NAMES.map((name, i) => {
      const revenue  = revenueByMonth[i];
      const variable = variableByMonth[i];
      const profit   = revenue - totalFixed - variable;
      const isPast   = new Date(year, i + 1, 1) <= today;
      return {
        month: name,
        monthIndex: i,
        revenue,
        fixedExpenses: totalFixed,
        variableExpenses: variable,
        totalExpenses: totalFixed + variable,
        netProfit: profit,
        isPast,
      };
    });

    // Annual totals (only past months + current)
    const pastMonths = months.filter((m) => m.isPast || (new Date(year, m.monthIndex, 1) <= today));
    const annualTotals = {
      revenue:          pastMonths.reduce((s, m) => s + m.revenue, 0),
      fixedExpenses:    totalFixed * pastMonths.length,
      variableExpenses: pastMonths.reduce((s, m) => s + m.variableExpenses, 0),
      netProfit:        pastMonths.reduce((s, m) => s + m.netProfit, 0),
    };

    // Available years: from first invoice/expense year to current year
    const firstInvoice = await prisma.invoice.findFirst({
      where: { workspaceId },
      orderBy: { dueDate: "asc" },
      select: { dueDate: true },
    });
    const firstYear = firstInvoice ? new Date(firstInvoice.dueDate).getFullYear() : today.getFullYear();
    const availableYears = Array.from(
      { length: today.getFullYear() - firstYear + 1 },
      (_, i) => firstYear + i
    ).reverse();

    return NextResponse.json({ months, annualTotals, availableYears, year });
  } catch (error) {
    console.error("FINANCE_ANNUAL_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
