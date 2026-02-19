import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WhatsAppService } from "@/lib/whatsapp";
import { addDays, startOfDay } from "date-fns";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const today = startOfDay(new Date());
    const threeDaysFromNow = addDays(today, 3);

    // 0. Buscar templates e credenciais do Workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        reminderTemplateUpcoming: true,
        reminderTemplateOverdue: true,
        whatsappUrl: true,
        whatsappApiKey: true,
        whatsappInstance: true,
      }
    });

    const upcomingTemplate = workspace?.reminderTemplateUpcoming || "Olá {{client_name}}! Lembramos que sua fatura no valor de R$ {{amount}} vence em {{due_date}}. Evite multas efetuando o pagamento em dia.";
    const overdueTemplate = workspace?.reminderTemplateOverdue || "Olá {{client_name}}! Identificamos que sua fatura no valor de R$ {{amount}} com vencimento em {{due_date}} ainda não foi quitada. Por favor, regularize sua situação.";

    // Validação de credenciais será feita após identificar se existem faturas elegíveis

    // 1. Buscar faturas PENDENTES que vencem em até 3 dias e ainda não receberam lembrete hoje
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        workspaceId,
        status: "PENDING",
        dueDate: {
          lte: threeDaysFromNow,
          gte: today,
        },
        OR: [
          { lastReminderAt: null },
          { lastReminderAt: { lt: today } }
        ]
      },
      include: {
        client: true,
      }
    });

    // 2. Buscar faturas ATRASADAS que ainda não receberam lembrete hoje
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        workspaceId,
        status: "OVERDUE",
        OR: [
          { lastReminderAt: null },
          { lastReminderAt: { lt: today } }
        ]
      },
      include: {
        client: true,
      }
    });

    const results: Array<{ id: string; status: string; type: "upcoming" | "overdue" }> = [];
    let skippedNoPhone = 0;

    // Se não há faturas para processar, retornar sucesso sem exigir credenciais do WhatsApp
    if ((pendingInvoices.length + overdueInvoices.length) === 0) {
      return NextResponse.json({
        processed: 0,
        attempted: 0,
        skippedNoPhone: 0,
        details: [],
        message: "Nenhuma fatura elegível para lembrete no período."
      });
    }

    // 0.1 Validar credenciais do WhatsApp somente quando houver faturas a processar
    const missing = {
      whatsappUrl: !workspace?.whatsappUrl,
      whatsappApiKey: !workspace?.whatsappApiKey,
      whatsappInstance: !workspace?.whatsappInstance,
    };
    if (missing.whatsappUrl || missing.whatsappApiKey || missing.whatsappInstance) {
      return NextResponse.json(
        {
          message: "Configurações do WhatsApp não encontradas. Configure em Configurações → Agência.",
          missing,
        },
        { status: 400 }
      );
    }

    const formatMessage = (template: string, invoice: any) => {
      return template
        .replace(/{{client_name}}/g, invoice.client?.name || "Cliente")
        .replace(/{{amount}}/g, invoice.amount.toLocaleString('pt-BR'))
        .replace(/{{valor}}/g, invoice.amount.toLocaleString('pt-BR'))
        .replace(/{{due_date}}/g, new Date(invoice.dueDate).toLocaleDateString('pt-BR'));
    };

    // Processar lembretes de vencimento próximo
    for (const invoice of pendingInvoices) {
      if (invoice.client?.phone) {
        const message = formatMessage(upcomingTemplate, invoice);
        
        try {
          await WhatsAppService.sendMessage(workspaceId, invoice.client.phone, message);
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { lastReminderAt: new Date() }
          });
          results.push({ id: invoice.id, status: "sent", type: "upcoming" });
        } catch (error) {
          console.error(`Failed to send reminder for invoice ${invoice.id}`, error);
          results.push({ id: invoice.id, status: "failed", type: "upcoming" });
        }
      } else {
        skippedNoPhone++;
      }
    }

    // Processar lembretes de atraso
    for (const invoice of overdueInvoices) {
      if (invoice.client?.phone) {
        const message = formatMessage(overdueTemplate, invoice);
        
        try {
          await WhatsAppService.sendMessage(workspaceId, invoice.client.phone, message);
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { lastReminderAt: new Date() }
          });
          results.push({ id: invoice.id, status: "sent", type: "overdue" });
        } catch (error) {
          console.error(`Failed to send overdue reminder for invoice ${invoice.id}`, error);
          results.push({ id: invoice.id, status: "failed", type: "overdue" });
        }
      } else {
        skippedNoPhone++;
      }
    }

    return NextResponse.json({ 
      processed: results.length,
      attempted: pendingInvoices.length + overdueInvoices.length,
      skippedNoPhone,
      details: results 
    });

  } catch (error) {
    console.error("FINANCE_REMINDERS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
