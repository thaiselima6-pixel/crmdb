import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    // Buscar projetos com data de entrega
    const projects = await prisma.project.findMany({
      where: { 
        workspaceId,
        endDate: { not: null }
      },
      select: {
        id: true,
        name: true,
        endDate: true,
      }
    });

    // Buscar tarefas com data de entrega
    const tasks = await prisma.task.findMany({
      where: {
        project: { workspaceId },
        dueDate: { not: null }
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
      }
    });

    const events = [
      ...projects.map(p => ({
        id: p.id,
        title: `Projeto: ${p.name}`,
        date: p.endDate,
        type: "PROJECT",
        originalData: p
      })),
      ...tasks.map(t => ({
        id: t.id,
        title: `Tarefa: ${t.title}`,
        date: t.dueDate,
        type: "TASK",
        originalData: t
      }))
    ];

    return NextResponse.json(events);
  } catch (error) {
    console.error("CALENDAR_EVENTS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
