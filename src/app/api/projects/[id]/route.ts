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

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        syllabus,
        status,
        priority,
        budget,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("PROJECT_PATCH", error);
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
