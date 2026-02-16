import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;

    const leads = await prisma.lead.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("LEADS_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    console.log("LEADS_POST: Body received:", body);
    console.log("LEADS_POST: WorkspaceId:", workspaceId);

    const { name, email, phone, company, status, value, source } = body;

    if (!name || !status) {
      return new NextResponse("Name and status are required", { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        company,
        status,
        value: value ? parseFloat(value) : 0,
        source,
        workspaceId,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("LEADS_POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new NextResponse("Lead ID is required", { status: 400 });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...updateData,
        value: updateData.value ? parseFloat(updateData.value) : undefined,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("LEADS_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
