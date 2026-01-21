import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;
  const spotifyUser = cookieStore.get("spotify_user")?.value;
  
  let parsedSpotifyUser = null;
  try {
    if (spotifyUser) {
      parsedSpotifyUser = JSON.parse(decodeURIComponent(spotifyUser));
    }
  } catch {
    // ignore parse error
  }

  const debug: Record<string, unknown> = {
    user_id_cookie: userId || "NOT SET",
    spotify_user_cookie: parsedSpotifyUser ? parsedSpotifyUser.display_name : "NOT SET",
  };

  if (userId) {
    const supabase = createAdminClient();
    
    // Check if user exists in database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    
    debug.user_in_db = user ? {
      id: user.id,
      display_name: user.display_name,
      spotify_id: user.spotify_id,
    } : null;
    debug.user_error = userError?.message || null;

    // Check game sessions for this user
    const { data: sessions, error: sessionsError } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(5);
    
    debug.recent_sessions = sessions || [];
    debug.sessions_error = sessionsError?.message || null;
    
    // Check what the leaderboard view shows
    const { data: leaderboard, error: lbError } = await supabase
      .from("top_scores")
      .select("*")
      .eq("id", userId)
      .single();
    
    debug.leaderboard_entry = leaderboard || null;
    debug.leaderboard_error = lbError?.message || null;
  }

  return NextResponse.json(debug, { status: 200 });
}
