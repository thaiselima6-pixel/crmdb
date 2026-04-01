import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const resolvedParams = await params;
    const { id: projectId } = resolvedParams;
    const body = await req.json();
    const { content } = body;

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const note = await prisma.projectNote.create({
      data: {
        content,
        projectId,
        workspaceId,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("PROJECT_NOTES_POST", error);
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

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { id, content } = body;

    const existingNote = await prisma.projectNote.findFirst({
      where: { id, workspaceId },
    });

    if (!existingNote) {
      return new NextResponse("Note not found", { status: 404 });
    }

    const note = await prisma.projectNote.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("PROJECT_NOTES_PATCH", error);
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

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { id } = body;

    const existingNote = await prisma.projectNote.findFirst({
      where: { id, workspaceId },
    });

    if (!existingNote) {
      return new NextResponse("Note not found", { status: 404 });
    }

    await prisma.projectNote.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("PROJECT_NOTES_DELETE", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
