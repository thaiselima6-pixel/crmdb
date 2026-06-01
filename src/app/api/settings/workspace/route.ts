import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { 
        id: true, 
        name: true, 
        slug: true, 
        logo: true,
        whatsappUrl: true,
        whatsappApiKey: true,
        whatsappInstance: true,
        n8nWebhookUrl: true,
        metaAdsEnabled: true,
        metaAdsPixelId: true,
        metaAdsToken: true,
        metaAdsAccountName: true,
        googleAdsEnabled: true,
        googleAdsCustomerId: true,
        googleAdsDeveloperToken: true,
        googleAdsAccountName: true,
        autoFollowUpEnabled: true,
        autoWelcomeEnabled: true,
        meetingRemindersEnabled: true,
        mayaEnabled: true,
        mayaSystemPrompt: true,
        kiwifyEnabled: true,
        kiwifyWebhookSecret: true,
        kiwifyCartRecoveryEnabled: true,
        kiwifyMsg1Template: true,
        kiwifyMsg2Template: true,
        kiwifyMsg3Template: true,
      }
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("SETTINGS_WORKSPACE_GET", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: body.name,
        logo: body.logo,
        whatsappUrl: body.whatsappUrl,
        whatsappApiKey: body.whatsappApiKey,
        whatsappInstance: body.whatsappInstance,
        n8nWebhookUrl: body.n8nWebhookUrl,
        metaAdsEnabled: body.metaAdsEnabled,
        metaAdsPixelId: body.metaAdsPixelId,
        googleAdsEnabled: body.googleAdsEnabled,
        googleAdsCustomerId: body.googleAdsCustomerId,
        googleAdsDeveloperToken: body.googleAdsDeveloperToken,
        autoFollowUpEnabled: body.autoFollowUpEnabled,
        autoWelcomeEnabled: body.autoWelcomeEnabled,
        meetingRemindersEnabled: body.meetingRemindersEnabled,
        mayaEnabled: body.mayaEnabled,
        mayaSystemPrompt: body.mayaSystemPrompt,
        kiwifyEnabled: body.kiwifyEnabled,
        kiwifyWebhookSecret: body.kiwifyWebhookSecret,
        kiwifyCartRecoveryEnabled: body.kiwifyCartRecoveryEnabled,
        kiwifyMsg1Template: body.kiwifyMsg1Template,
        kiwifyMsg2Template: body.kiwifyMsg2Template,
        kiwifyMsg3Template: body.kiwifyMsg3Template,
      }
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("SETTINGS_WORKSPACE_PATCH", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
