import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    let pipelines = await prisma.pipeline.findMany({
      where: { workspaceId },
      include: {
        stages: {
          orderBy: { order: "asc" }
        }
      }
    });

    // Se não houver pipeline, cria um padrão
    if (pipelines.length === 0) {
      const pipeline = await prisma.pipeline.create({
        data: {
          name: "Vendas",
          workspaceId,
          stages: {
            create: [
              { name: "Novo", order: 0 },
              { name: "Contatado", order: 1 },
              { name: "Qualificado", order: 2 },
              { name: "Proposta", order: 3 },
              { name: "Negociação", order: 4 },
              { name: "Ganhos", order: 5 },
            ]
          }
        },
        include: {
          stages: {
            orderBy: { order: "asc" }
          }
        }
      });
      pipelines = [pipeline];
    }

    return NextResponse.json(pipelines);
  } catch (error) {
    console.error("PIPELINES_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { name, stages } = body;

    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        workspaceId,
        stages: {
          create: stages.map((s: any, index: number) => ({
            name: s.name,
            order: index,
            color: s.color
          }))
        }
      },
      include: {
        stages: true
      }
    });

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error("PIPELINES_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
