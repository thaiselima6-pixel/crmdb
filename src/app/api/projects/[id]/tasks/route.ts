import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("TASKS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { title, description, dueDate, status, priority } = body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        projectId: id,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("TASKS_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { id: taskId, status } = body;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("TASKS_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { id: taskId } = body;

    await prisma.task.delete({
      where: { id: taskId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("TASKS_DELETE", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
