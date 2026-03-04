import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const resolvedParams = await params;
    const { provider } = resolvedParams;

    if (provider === "meta") {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          metaAdsToken: null,
          metaAdsAccountName: null,
          metaAdsEnabled: false,
        },
      });
    } else if (provider === "google") {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          googleAdsDeveloperToken: null,
          googleAdsAccountName: null,
          googleAdsEnabled: false,
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DISCONNECT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
