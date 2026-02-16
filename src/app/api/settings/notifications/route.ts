import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true }
    });

    return NextResponse.json(user?.notificationSettings || {});
  } catch (error) {
    console.error("SETTINGS_NOTIFICATIONS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const userId = (session.user as any).id;
    const body = await req.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { notificationSettings: body }
    });

    return NextResponse.json(user.notificationSettings);
  } catch (error) {
    console.error("SETTINGS_NOTIFICATIONS_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
