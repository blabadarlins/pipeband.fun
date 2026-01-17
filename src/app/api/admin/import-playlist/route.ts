import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PLAYLIST_ID = "75AsluzBUNhrjKMjEdCVnv";

// Use service role key for admin operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSpotifyAccessToken(): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token");
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchPlaylistTracks(accessToken: string) {
  const tracks: any[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=100`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch playlist tracks");
    }

    const data = await response.json();
    tracks.push(...data.items);
    url = data.next;
  }

  return tracks;
}

export async function GET(request: NextRequest) {
  // Simple auth check - in production, use proper admin authentication
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SPOTIFY_CLIENT_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();

    // Fetch all tracks from playlist
    const playlistTracks = await fetchPlaylistTracks(accessToken);

    // Transform and prepare tracks for database
    const tracksToInsert = playlistTracks
      .filter((item: any) => item.track && item.track.id)
      .map((item: any) => {
        const track = item.track;
        const artist = track.artists[0]?.name || "Unknown Band";
        const album = track.album;
        const releaseYear = album.release_date
          ? parseInt(album.release_date.split("-")[0])
          : 2000;

        return {
          spotify_uri: track.uri,
          band_name: artist,
          year: releaseYear,
          album_name: album.name,
          track_name: track.name,
          preview_url: track.preview_url,
        };
      });

    // Clear existing tracks and insert new ones
    const { error: deleteError } = await supabase
      .from("tracks")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (deleteError) {
      console.error("Delete error:", deleteError);
    }

    // Insert new tracks
    const { data, error: insertError } = await supabase
      .from("tracks")
      .insert(tracksToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${data?.length || 0} tracks from playlist`,
      tracks: data,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import playlist", details: String(error) },
      { status: 500 }
    );
  }
}
