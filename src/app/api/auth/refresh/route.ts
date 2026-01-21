import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/spotify";
import { cookies } from "next/headers";
import { setSpotifyAccessCookie } from "@/lib/cookies/server";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const tokens = await refreshAccessToken(refreshToken);

    setSpotifyAccessCookie(cookieStore, tokens.access_token, tokens.expires_in);

    return NextResponse.json({ 
      success: true, 
      access_token: tokens.access_token,
      expires_in: tokens.expires_in 
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 });
  }
}
