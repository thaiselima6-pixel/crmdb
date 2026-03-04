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
    const { name, url, size, type } = body;

    const file = await prisma.projectFile.create({
      data: {
        name,
        url,
        size,
        type,
        projectId,
        workspaceId,
      },
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error("PROJECT_FILES_POST", error);
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
    const { id } = body;

    await prisma.projectFile.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("PROJECT_FILES_DELETE", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
