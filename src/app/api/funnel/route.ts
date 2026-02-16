import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      select: { status: true }
    });

    const counts: any = {
      NEW: 0,
      CONTACTED: 0,
      PROPOSAL: 0,
      WON: 0,
      LOST: 0
    };

    leads.forEach(lead => {
      if (counts[lead.status] !== undefined) {
        counts[lead.status]++;
      }
    });

    return NextResponse.json({
      counts,
      leadsByStatus: leads,
      total: leads.length
    });
  } catch (error) {
    console.error("FUNNEL_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
