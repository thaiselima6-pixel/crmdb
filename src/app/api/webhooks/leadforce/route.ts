import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WhatsAppService } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key") || req.headers.get("X-API-Key");
    if (!apiKey || apiKey !== process.env.LEADFORCE_API_KEY) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Suporta dois formatos:
    // 1) Flat (chamada direta):  body.name, body.phone, body.email
    // 2) sync-crm nested:        body.data.company_name, body.data.phone, body.data.contact_email
    const d = body.data || body;

    const name    = d.name    || d.nome     || d.contact_name  || d.company_name || body.nome    || "Lead LeadForce";
    const phone   = d.phone   || d.telefone || d.fone          || null;
    const email   = d.email   || d.contact_email               || "sem-email@leadforce.com";
    const company = d.company || d.empresa  || d.company_name  || d.negocio      || null;
    const source  = d.source  || d.origem   || d.niche         || "leadforce";
    const message = d.message || d.mensagem || null;

    // workspaceId pode vir no body raiz, no campo data, ou usa o primeiro workspace
    let workspaceId: string = body.workspaceId || body.workspace_id || d.workspaceId || "";
    if (!workspaceId) {
      const ws = await prisma.workspace.findFirst({ select: { id: true } });
      if (!ws) return new NextResponse("No workspace found", { status: 400 });
      workspaceId = ws.id;
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        autoWelcomeEnabled: true,
        whatsappUrl: true,
        whatsappApiKey: true,
      },
    });
    if (!workspace) return new NextResponse("Workspace not found", { status: 404 });

    // Evita duplicata por telefone ou email
    if (phone) {
      const existing = await prisma.lead.findFirst({
        where: { workspaceId, phone },
        select: { id: true },
      });
      if (existing) {
        console.log(`LEADFORCE_DUPLICATE: phone ${phone} already exists as lead ${existing.id}`);
        return NextResponse.json({ success: true, leadId: existing.id, duplicate: true });
      }
    }

    // Coloca o lead no primeiro estágio do pipeline
    const firstStage = await prisma.pipelineStage.findFirst({
      where: { pipeline: { workspaceId } },
      orderBy: { order: "asc" },
      select: { id: true, pipelineId: true },
    });

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        company,
        source,
        status: "NEW",
        tags: ["LeadForce"],
        workspaceId,
        ...(firstStage && {
          stageId: firstStage.id,
          pipelineId: firstStage.pipelineId,
        }),
      },
    });

    // Boas-vindas automáticas via WhatsApp
    let whatsappSent = false;
    if (workspace.autoWelcomeEnabled && phone && workspace.whatsappUrl && workspace.whatsappApiKey) {
      try {
        const firstName = name.split(" ")[0];
        const welcomeMsg =
          message ||
          `Olá, ${firstName}! 👋\n\nRecebi seu contato e quero te ajudar.\n\nEm breve um consultor da *${workspace.name}* entrará em contato. Pode me contar: qual é a sua maior necessidade hoje?`;

        await WhatsAppService.sendMessage(workspaceId, phone, welcomeMsg);
        whatsappSent = true;
      } catch (err) {
        console.error("LEADFORCE_WHATSAPP_ERROR", err);
      }
    }

    console.log(`LEADFORCE_LEAD_CREATED: ${lead.id} | WhatsApp: ${whatsappSent}`);

    return NextResponse.json({ success: true, leadId: lead.id, whatsappSent });
  } catch (error) {
    console.error("LEADFORCE_WEBHOOK_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
