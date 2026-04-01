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

    const tokenRes = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`
    );

    const shortLivedToken = tokenRes.data.access_token;

    // Exchange for long-lived token
    const longLivedRes = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`
    );
    
    const accessToken = longLivedRes.data.access_token;
    const expiresIn = longLivedRes.data.expires_in; // usually 60 days

    // 2. Get user info or account name
    const userRes = await axios.get(
      `https://graph.facebook.com/me?access_token=${accessToken}`
    );

    const accountName = userRes.data.name;
    const workspaceId = (session.user as any).workspaceId;

    // 3. Save to workspace and create SocialAccount
    await prisma.$transaction(async (tx) => {
      await tx.workspace.update({
        where: { id: workspaceId },
        data: {
          metaAdsEnabled: true,
          metaAdsAccountName: accountName,
        },
      });

      // Insert or update the social account
      const existingAccount = await tx.socialAccount.findFirst({
        where: { workspaceId, provider: "FACEBOOK" }
      });

      if (existingAccount) {
        await tx.socialAccount.update({
          where: { id: existingAccount.id },
          data: {
            accessToken,
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
          }
        });
      } else {
        await tx.socialAccount.create({
          data: {
            workspaceId,
            provider: "FACEBOOK",
            accessToken,
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
          }
        });
      }
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?success=meta`);
  } catch (error) {
    console.error("FACEBOOK_ADS_CALLBACK_ERROR", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=meta`);
  }
}
