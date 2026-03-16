import { prisma } from './prisma';
import { WhatsAppService } from './whatsapp';
import { addDays, startOfDay } from 'date-fns';

export interface ReminderResult {
  invoiceId: string;
  status: 'sent' | 'failed' | 'skipped_no_phone';
  type: 'twoDaysBefore' | 'dueToday' | 'oneDayAfter';
}

export interface RemindersResponse {
  processed: number;
  attempted: number;
  skippedNoPhone: number;
  details: ReminderResult[];
  message?: string;
  error?: string;
}

const DEFAULT_UPCOMING = "Olá {{client_name}}! Lembramos que sua fatura no valor de R$ {{valor}} vence em {{due_date}}. Evite multas efetuando o pagamento em dia.";
const DEFAULT_DUE_TODAY = "Olá {{client_name}}! Sua fatura no valor de R$ {{valor}} vence hoje ({{due_date}}). Efetue o pagamento para evitar multas e juros.";
const DEFAULT_OVERDUE = "Olá {{client_name}}! Identificamos que sua fatura no valor de R$ {{valor}} com vencimento em {{due_date}} ainda não foi quitada. Por favor, regularize sua situação.";

export async function sendInvoiceReminders(workspaceId: string): Promise<RemindersResponse> {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const twoDaysFromNow = addDays(today, 2);
  const threeDaysFromNow = addDays(today, 3);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      reminderTemplateUpcoming: true,
      reminderTemplateDueToday: true,
      reminderTemplateOverdue: true,
      whatsappUrl: true,
      whatsappApiKey: true,
    },
  });

  const upcomingTemplate = workspace?.reminderTemplateUpcoming || DEFAULT_UPCOMING;
  const dueTodayTemplate = workspace?.reminderTemplateDueToday || DEFAULT_DUE_TODAY;
  const overdueTemplate = workspace?.reminderTemplateOverdue || DEFAULT_OVERDUE;

  // Auto-atualizar faturas PENDING vencidas para OVERDUE
  await prisma.invoice.updateMany({
    where: { workspaceId, status: 'PENDING', dueDate: { lt: today } },
    data: { status: 'OVERDUE' },
  });

  const notRemindedToday = {
    OR: [
      { lastReminderAt: null },
      { lastReminderAt: { lt: today } },
    ],
  };

  // 3 janelas precisas
  const [twoDaysBefore, dueToday, oneDayAfter] = await Promise.all([
    // 2 dias antes do vencimento
    prisma.invoice.findMany({
      where: {
        workspaceId,
        status: 'PENDING',
        dueDate: { gte: twoDaysFromNow, lt: threeDaysFromNow },
        ...notRemindedToday,
      },
      include: { client: true },
    }),
    // No dia do vencimento
    prisma.invoice.findMany({
      where: {
        workspaceId,
        status: 'PENDING',
        dueDate: { gte: today, lt: tomorrow },
        ...notRemindedToday,
      },
      include: { client: true },
    }),
    // 1 dia após o vencimento
    prisma.invoice.findMany({
      where: {
        workspaceId,
        status: 'OVERDUE',
        dueDate: { lt: today },
        ...notRemindedToday,
      },
      include: { client: true },
    }),
  ]);

  const attempted = twoDaysBefore.length + dueToday.length + oneDayAfter.length;

  if (attempted === 0) {
    return {
      processed: 0,
      attempted: 0,
      skippedNoPhone: 0,
      details: [],
      message: 'Nenhuma fatura elegível para lembrete hoje.',
    };
  }

  if (!workspace?.whatsappUrl || !workspace?.whatsappApiKey) {
    return {
      processed: 0,
      attempted,
      skippedNoPhone: 0,
      details: [],
      error: 'missing_credentials',
      message: 'Configurações do WhatsApp não encontradas. Configure em Integrações → WhatsApp (UazAPI).',
    };
  }

  const formatMessage = (template: string, invoice: any) =>
    template
      .replace(/{{client_name}}/g, invoice.client?.name || 'Cliente')
      .replace(/{{amount}}/g, Number(invoice.amount).toLocaleString('pt-BR'))
      .replace(/{{valor}}/g, Number(invoice.amount).toLocaleString('pt-BR'))
      .replace(/{{due_date}}/g, new Date(invoice.dueDate).toLocaleDateString('pt-BR'));

  const results: ReminderResult[] = [];
  let skippedNoPhone = 0;

  const processGroup = async (
    invoices: any[],
    template: string,
    type: ReminderResult['type'],
  ) => {
    for (const invoice of invoices) {
      if (!invoice.client?.phone) {
        skippedNoPhone++;
        results.push({ invoiceId: invoice.id, status: 'skipped_no_phone', type });
        continue;
      }
      try {
        await WhatsAppService.sendMessage(workspaceId, invoice.client.phone, formatMessage(template, invoice));
        await prisma.invoice.update({ where: { id: invoice.id }, data: { lastReminderAt: new Date() } });
        results.push({ invoiceId: invoice.id, status: 'sent', type });
      } catch {
        results.push({ invoiceId: invoice.id, status: 'failed', type });
      }
    }
  };

  await processGroup(twoDaysBefore, upcomingTemplate, 'twoDaysBefore');
  await processGroup(dueToday, dueTodayTemplate, 'dueToday');
  await processGroup(oneDayAfter, overdueTemplate, 'oneDayAfter');

  return {
    processed: results.filter((r) => r.status === 'sent').length,
    attempted,
    skippedNoPhone,
    details: results,
  };
}
