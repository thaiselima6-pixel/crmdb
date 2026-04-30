import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const workspaceId = (session.user as any).workspaceId;
    const { id } = await params;

    await prisma.calendarEvent.deleteMany({ where: { id, workspaceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CALENDAR_EVENT_DELETE", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
