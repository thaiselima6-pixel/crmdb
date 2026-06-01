import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const take = Math.min(Number(url.searchParams.get("limit") || "50"), 200);

    const carts = await prisma.kiwifyAbandonedCart.findMany({
      where: { workspaceId, ...(status ? { status } : {}) },
      orderBy: { abandonedAt: "desc" },
      take,
    });

    const summary = await prisma.kiwifyAbandonedCart.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: { id: true },
    });

    return NextResponse.json({ carts, summary });
  } catch (error) {
    console.error("KIWIFY_CARTS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
