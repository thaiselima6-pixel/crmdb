import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            users: {
              where: {
                role: "ADMIN"
              },
              select: {
                email: true,
                name: true
              },
              take: 1
            }
          }
        }
      }
    });

    if (!proposal) {
      return new NextResponse("Proposal not found", { status: 404 });
    }

    // Update status to OPENED if it was just SENT
    if (proposal.status === "SENT") {
      await prisma.proposal.update({
        where: { id },
        data: { status: "OPENED" }
      });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("PUBLIC_PROPOSAL_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
