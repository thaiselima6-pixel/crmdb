import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ leads: [], clients: [], projects: [], proposals: [] });
    }

    const [leads, clients, projects, proposals] = await Promise.all([
      prisma.lead.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
          ]
        },
        take: 5
      }),
      prisma.client.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
          ]
        },
        take: 5
      }),
      prisma.project.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ]
        },
        take: 5
      }),
      prisma.proposal.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { clientName: { contains: query, mode: "insensitive" } },
            { clientEmail: { contains: query, mode: "insensitive" } },
          ]
        },
        take: 5
      })
    ]);

    return NextResponse.json({
      leads,
      clients,
      projects,
      proposals
    });

  } catch (error) {
    console.error("SEARCH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
