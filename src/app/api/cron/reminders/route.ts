import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceReminders } from "@/lib/send-invoice-reminders";

// Endpoint chamado automaticamente pelo Vercel Cron (ou qualquer scheduler externo).
// Protegido via CRON_SECRET definido nas variáveis de ambiente.
export async function GET(req: Request) {
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!isVercelCron && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const workspaces = await prisma.workspace.findMany({
      where: { autoRemindersEnabled: true },
      select: { id: true, name: true },
    });

    const results = [];
    for (const ws of workspaces) {
      try {
        const result = await sendInvoiceReminders(ws.id);
        results.push({ workspaceId: ws.id, name: ws.name, ...result });
      } catch (error) {
        console.error(`Cron reminders failed for workspace ${ws.id}`, error);
        results.push({ workspaceId: ws.id, name: ws.name, error: String(error) });
      }
    }

    return NextResponse.json({
      workspacesProcessed: workspaces.length,
      executedAt: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("CRON_REMINDERS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
