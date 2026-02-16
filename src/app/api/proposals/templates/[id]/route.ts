import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { id } = await params;

    // Verify ownership before deleting
    const template = await prisma.proposalTemplate.findFirst({
      where: {
        id,
        workspaceId
      }
    });

    if (!template) {
      return new NextResponse("Not found", { status: 404 });
    }

    await prisma.proposalTemplate.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("TEMPLATE_DELETE", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
