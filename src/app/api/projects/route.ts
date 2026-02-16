import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("PROJECTS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { name, description, status, clientId, startDate, endDate, budget } = body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || "PLANNING",
        clientId,
        workspaceId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : 0,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("PROJECTS_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { id, ...updateData } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        budget: updateData.budget ? parseFloat(updateData.budget) : undefined,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("PROJECTS_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
