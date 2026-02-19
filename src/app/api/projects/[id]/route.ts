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
    const workspaceId = (session.user as any).workspaceId;

    const project = await prisma.project.findUnique({
      where: { 
        id,
        workspaceId 
      },
      include: {
        client: true,
      }
    });

    if (!project) return new NextResponse("Not Found", { status: 404 });

    return NextResponse.json(project);
  } catch (error) {
    console.error("PROJECT_GET", error);
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

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { name, description, syllabus, status, priority, budget, startDate, endDate } = body;

    const data: any = {};
    if (typeof name === "string") data.name = name;
    if (typeof description === "string" || description === null) data.description = description;
    if (typeof syllabus === "string" || syllabus === null) data.syllabus = syllabus;
    if (typeof status === "string") data.status = status;
    if (typeof priority === "string") data.priority = priority;
    if (budget !== undefined) {
      const parsed = typeof budget === "number" ? budget : parseFloat(String(budget).replace(",", "."));
      if (Number.isNaN(parsed)) {
        return NextResponse.json({ message: "Orçamento inválido." }, { status: 400 });
      }
      data.budget = parsed;
    }
    if (startDate) {
      const d = new Date(startDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ message: "Data de início inválida." }, { status: 400 });
      }
      data.startDate = d;
    }
    if (endDate) {
      const d = new Date(endDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ message: "Prazo final inválido." }, { status: 400 });
      }
      data.endDate = d;
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("PROJECT_PATCH", error);
    return NextResponse.json({ message: "Erro ao atualizar projeto.", detail: (error as any)?.message || null }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await prisma.project.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("PROJECT_DELETE", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
