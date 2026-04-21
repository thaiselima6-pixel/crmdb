import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { stages } = await req.json();

    const pipeline = await prisma.pipeline.findFirst({
      where: { id: params.id, workspaceId },
      include: { stages: true },
    });
    if (!pipeline) return new NextResponse("Not Found", { status: 404 });

    const existingIds = pipeline.stages.map((s) => s.id);
    const incomingExistingIds = stages
      .filter((s: any) => !String(s.id).startsWith("new-"))
      .map((s: any) => s.id);

    // Delete stages removed by user (only if no leads are assigned to them)
    const toDelete = existingIds.filter((id) => !incomingExistingIds.includes(id));
    for (const id of toDelete) {
      const count = await prisma.lead.count({ where: { stageId: id } });
      if (count === 0) {
        await prisma.pipelineStage.delete({ where: { id } });
      }
    }

    // Update existing and create new stages
    for (const stage of stages) {
      if (String(stage.id).startsWith("new-")) {
        await prisma.pipelineStage.create({
          data: {
            name: stage.name,
            order: stage.order ?? 0,
            color: stage.color ?? null,
            pipelineId: params.id,
          },
        });
      } else {
        await prisma.pipelineStage.update({
          where: { id: stage.id },
          data: { name: stage.name, order: stage.order ?? 0 },
        });
      }
    }

    const updated = await prisma.pipeline.findFirst({
      where: { id: params.id },
      include: { stages: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PIPELINES_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
