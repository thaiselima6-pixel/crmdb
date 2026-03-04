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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google-ads`;

    // 1. Exchange code for access token
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token } = tokenRes.data;

    // 2. Get user info
    const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const accountName = userRes.data.name || userRes.data.email;
    const workspaceId = (session.user as any).workspaceId;

    // 3. Save to workspace (using access_token or refresh_token if offline access was requested)
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        googleAdsDeveloperToken: access_token, // Ideally we'd store the refresh token and handle renewal
        googleAdsAccountName: accountName,
        googleAdsEnabled: true,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?success=google`);
  } catch (error) {
    console.error("GOOGLE_ADS_CALLBACK_ERROR", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=google`);
  }
}
