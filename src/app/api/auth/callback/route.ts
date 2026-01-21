import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getSpotifyUser } from "@/lib/spotify";
import { upsertUserServer, createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  setSpotifyAccessCookie,
  setSpotifyRefreshCookie,
  setSpotifyUserCookie,
  setUserIdCookie,
} from "@/lib/cookies/server";

function getOrigin(request: NextRequest): string {
  // Use forwarded headers (set by Vercel/proxies) for the correct public URL
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
}

const isDebug = process.env.NODE_ENV !== "production";
const debugLog = (...args: unknown[]) => {
  if (isDebug) {
    console.log(...args);
  }
};

export async function GET(request: NextRequest) {
  const origin = getOrigin(request);
  debugLog("Auth callback hit:", request.url);
  debugLog("Determined origin:", origin);
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  debugLog("Code:", code ? "present" : "missing");
  debugLog("Error:", error);

  if (error) {
    debugLog("Spotify returned error:", error);
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  if (!code) {
    debugLog("No code in callback");
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  try {
    debugLog("Exchanging code for tokens...");
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    debugLog("Tokens received:", tokens.access_token ? "yes" : "no");
    
    // Get user profile from Spotify
    const spotifyUser = await getSpotifyUser(tokens.access_token);
    debugLog("User fetched:", spotifyUser.display_name);

    // Store tokens in cookies (in production, store in database)
    const cookieStore = await cookies();

    setSpotifyAccessCookie(cookieStore, tokens.access_token, tokens.expires_in);
    setSpotifyRefreshCookie(cookieStore, tokens.refresh_token);
    setSpotifyUserCookie(cookieStore, {
      id: spotifyUser.id,
      display_name: spotifyUser.display_name,
      email: spotifyUser.email,
      images: spotifyUser.images,
    });

    // Upsert user to Supabase database
    let dbUser = await upsertUserServer(spotifyUser);
    debugLog("User upserted to database:", dbUser?.id);

    // Fallback: if upsertUserServer failed, try to find existing user
    if (!dbUser) {
      console.error("upsertUserServer failed, trying to find existing user by spotify_id:", spotifyUser.id);
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("spotify_id", spotifyUser.id)
          .single();
        
        if (error) {
          console.error("Fallback user lookup failed:", error.message);
        } else if (data) {
          debugLog("Found existing user via fallback:", data.id);
          dbUser = data;
        }
      } catch (fallbackError) {
        console.error("Fallback user lookup threw error:", fallbackError);
      }
    }

    // Store the database user ID in a cookie for game session tracking
    if (dbUser?.id) {
      setUserIdCookie(cookieStore, dbUser.id);
      debugLog("user_id cookie set successfully:", dbUser.id);
    } else {
      console.error("CRITICAL: Could not create or find user for spotify_id:", spotifyUser.id);
    }

    return NextResponse.redirect(`${origin}/quiz`);
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }
}
