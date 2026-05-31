import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.SITE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

  if (error) {
    return NextResponse.redirect(`${baseUrl}/tools/youtube-title-split-test?error=auth_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/tools/youtube-title-split-test?error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/youtube/auth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/tools/youtube-title-split-test?error=not_configured`);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData);
      return NextResponse.redirect(`${baseUrl}/tools/youtube-title-split-test?error=token_exchange`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const tokenExpiry = Date.now() + expires_in * 1000;

    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const channelData = await channelResponse.json();

    const channelId = channelData.items?.[0]?.id || null;
    const channelTitle = channelData.items?.[0]?.snippet?.title || null;

    const existingUser = await query(
      "SELECT id FROM youtube_users WHERE google_user_id = $1",
      [userInfo.id]
    );

    let userId: number;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id as number;
      await query(
        `UPDATE youtube_users 
         SET email = $1, channel_id = $2, channel_title = $3, access_token = $4, refresh_token = $5, token_expiry = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [userInfo.email, channelId, channelTitle, access_token, refresh_token, tokenExpiry, userId]
      );
    } else {
      const insertResult = await query(
        `INSERT INTO youtube_users (google_user_id, email, channel_id, channel_title, access_token, refresh_token, token_expiry)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [userInfo.id, userInfo.email, channelId, channelTitle, access_token, refresh_token, tokenExpiry]
      );
      userId = insertResult.rows[0].id as number;
    }

    const cookieStore = await cookies();
    cookieStore.set("youtube_user_id", userId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.redirect(`${baseUrl}/tools/youtube-title-split-test`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${baseUrl}/tools/youtube-title-split-test?error=callback_error`);
  }
}
