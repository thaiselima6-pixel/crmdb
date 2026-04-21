import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mapeamento de status legados para order do estágio
const STATUS_ORDER: Record<string, number> = {
  NEW: 0,
  CONTACTED: 1,
  QUALIFIED: 2,
  PROPOSAL: 3,
  NEGOTIATION: 4,
  WON: 5,
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    // Busca o pipeline ativo (primeiro do workspace)
    let pipeline = await prisma.pipeline.findFirst({
      where: { workspaceId },
      include: { stages: { orderBy: { order: "asc" } } },
    });

    // Cria pipeline padrão se não existir
    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: {
          name: "Vendas",
          workspaceId,
          stages: {
            create: [
              { name: "Novos Leads", order: 0 },
              { name: "Contatados", order: 1 },
              { name: "Qualificados", order: 2 },
              { name: "Proposta", order: 3 },
              { name: "Negociação", order: 4 },
              { name: "Ganhos", order: 5 },
            ],
          },
        },
        include: { stages: { orderBy: { order: "asc" } } },
      });
    }

    const stages = pipeline.stages;

    // Busca todos os leads do workspace
    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        value: true,
        status: true,
        stageId: true,
      },
    });

    // Para leads sem stageId, atribui baseado no status legado
    const leadsToUpdate: { id: string; stageId: string }[] = [];
    for (const lead of leads) {
      if (!lead.stageId) {
        const order = STATUS_ORDER[lead.status] ?? 0;
        const targetStage = stages[Math.min(order, stages.length - 1)];
        if (targetStage) {
          lead.stageId = targetStage.id;
          leadsToUpdate.push({ id: lead.id, stageId: targetStage.id });
        }
      }
    }

    // Persiste os stageIds dos leads legados em lote
    if (leadsToUpdate.length > 0) {
      await Promise.all(
        leadsToUpdate.map((l) =>
          prisma.lead.update({ where: { id: l.id }, data: { stageId: l.stageId, pipelineId: pipeline!.id } })
        )
      );
    }

    return NextResponse.json({ pipeline, stages, leads });
  } catch (error) {
    console.error("FUNNEL_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
