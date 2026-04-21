import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WhatsAppService } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.LEADFORCE_API_KEY) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Aceita campos em português ou inglês
    const name    = body.name    || body.nome     || body.contact || "Lead LeadForce";
    const phone   = body.phone   || body.telefone || body.fone    || null;
    const email   = body.email   || "sem-email@leadforce.com";
    const company = body.company || body.empresa  || body.negocio || null;
    const source  = body.source  || body.origem   || "leadforce";
    const message = body.message || body.mensagem || null;

    // workspaceId pode vir no body; senão usa o primeiro workspace
    let workspaceId: string = body.workspaceId || "";
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
