import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const workspaceId = (session.user as any).workspaceId;

    const [projects, tasks, calendarEvents] = await Promise.all([
      prisma.project.findMany({
        where: { workspaceId, endDate: { not: null } },
        select: { id: true, name: true, endDate: true },
      }),
      prisma.task.findMany({
        where: { project: { workspaceId }, dueDate: { not: null } },
        select: { id: true, title: true, description: true, status: true, priority: true, dueDate: true, projectId: true },
      }),
      prisma.calendarEvent.findMany({
        where: { workspaceId },
        include: { client: { select: { id: true, name: true } } },
        orderBy: { date: "asc" },
      }),
    ]);

    const events = [
      ...projects.map((p) => ({ id: p.id, title: `Projeto: ${p.name}`, date: p.endDate, type: "PROJECT", originalData: p })),
      ...tasks.map((t) => ({ id: t.id, title: `Tarefa: ${t.title}`, date: t.dueDate, type: "TASK", originalData: t })),
      ...calendarEvents.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        type: "EVENT",
        priority: e.priority,
        description: e.description,
        client: e.client,
        originalData: e,
      })),
    ];

    return NextResponse.json(events);
  } catch (error) {
    console.error("CALENDAR_EVENTS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const workspaceId = (session.user as any).workspaceId;

    const { title, date, description, priority, clientId } = await req.json();

    if (!title || !date) {
      return NextResponse.json({ message: "Título e data são obrigatórios." }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        date: new Date(date),
        description: description || null,
        priority: priority || "MEDIUM",
        clientId: clientId || null,
        workspaceId,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("CALENDAR_EVENT_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
