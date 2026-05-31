import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

async function getAccessToken(userId: number): Promise<string | null> {
  const result = await query(
    "SELECT access_token, refresh_token, token_expiry FROM youtube_users WHERE id = $1",
    [userId]
  );

  if (result.rows.length === 0) return null;

  const user = result.rows[0] as { token_expiry: number | null; access_token: string | null; refresh_token: string | null };
  const now = Date.now();

  if (user.token_expiry && user.token_expiry > now) {
    return user.access_token;
  }

  if (!user.refresh_token) return null;

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: user.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Token refresh error:", data);
      return null;
    }

    const newExpiry = Date.now() + data.expires_in * 1000;
    await query(
      "UPDATE youtube_users SET access_token = $1, token_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [data.access_token, newExpiry, userId]
    );

    return data.access_token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("youtube_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accessToken = await getAccessToken(parseInt(userId));

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to get access token. Please reconnect your YouTube account." }, { status: 401 });
    }

    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=20&order=date",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const data = await response.json();

    if (data.error) {
      console.error("YouTube API error:", data.error);
      return NextResponse.json({ error: data.error.message || "Failed to fetch videos" }, { status: 400 });
    }

    const videos = (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Fetch videos error:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
