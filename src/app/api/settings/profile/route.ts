import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const userId = (session.user as any).id;
    const { name } = await req.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("SETTINGS_PROFILE_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
