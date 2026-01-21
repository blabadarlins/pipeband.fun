import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getSpotifyUser } from "@/lib/spotify";
import { upsertUserServer } from "@/lib/supabase/server";
import { cookies } from "next/headers";

function getOrigin(request: NextRequest): string {
  // Use forwarded headers (set by Vercel/proxies) for the correct public URL
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const origin = getOrigin(request);
  console.log("Auth callback hit:", request.url);
  console.log("Determined origin:", origin);
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  console.log("Code:", code ? "present" : "missing");
  console.log("Error:", error);

  if (error) {
    console.log("Spotify returned error:", error);
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  if (!code) {
    console.log("No code in callback");
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  try {
    console.log("Exchanging code for tokens...");
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log("Tokens received:", tokens.access_token ? "yes" : "no");
    
    // Get user profile from Spotify
    const spotifyUser = await getSpotifyUser(tokens.access_token);
    console.log("User fetched:", spotifyUser.display_name);

    // Store tokens in cookies (in production, store in database)
    const cookieStore = await cookies();
    
    cookieStore.set("spotify_access_token", tokens.access_token, {
      httpOnly: false, // Needs to be readable by client JS for Web Playback SDK
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
    });

    cookieStore.set("spotify_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    cookieStore.set("spotify_user", JSON.stringify({
      id: spotifyUser.id,
      display_name: spotifyUser.display_name,
      email: spotifyUser.email,
      images: spotifyUser.images,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Upsert user to Supabase database
    const dbUser = await upsertUserServer(spotifyUser);
    console.log("User upserted to database:", dbUser?.id);

    // Store the database user ID in a cookie for game session tracking
    if (dbUser?.id) {
      cookieStore.set("user_id", dbUser.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return NextResponse.redirect(`${origin}/quiz`);
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }
}
