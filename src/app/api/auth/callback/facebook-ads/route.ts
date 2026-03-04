import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) return new NextResponse("No code provided", { status: 400 });

    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/facebook-ads`;

    // 1. Exchange code for access token
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`
    );

    const accessToken = tokenRes.data.access_token;

    // 2. Get user info or account name
    const userRes = await axios.get(
      `https://graph.facebook.com/me?access_token=${accessToken}`
    );

    const accountName = userRes.data.name;
    const workspaceId = (session.user as any).workspaceId;

    // 3. Save to workspace
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        metaAdsToken: accessToken,
        metaAdsAccountName: accountName,
        metaAdsEnabled: true,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?success=meta`);
  } catch (error) {
    console.error("FACEBOOK_ADS_CALLBACK_ERROR", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=meta`);
  }
}
