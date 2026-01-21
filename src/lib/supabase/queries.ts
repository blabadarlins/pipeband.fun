import { createClient } from "./client";
import type { Track, LeaderboardEntry } from "@/types";

export async function getRandomTracks(count: number = 10): Promise<Track[]> {
  const supabase = createClient();
  
  // Fetch all tracks and randomly select
  const { data, error } = await supabase
    .from("tracks")
    .select("*");

  if (error) {
    console.error("Error fetching tracks:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Shuffle and take the requested count
  const shuffled = data.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function getAllBandNames(): Promise<string[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("tracks")
    .select("band_name");

  if (error) {
    console.error("Error fetching band names:", error);
    return [];
  }

  // Get unique band names
  const uniqueBands = [...new Set(data?.map((t) => t.band_name) || [])];
  return uniqueBands;
}

export async function getAllYears(): Promise<number[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("tracks")
    .select("year");

  if (error) {
    console.error("Error fetching years:", error);
    return [];
  }

  // Get unique years
  const uniqueYears = [...new Set(data?.map((t) => t.year) || [])];
  return uniqueYears.sort((a, b) => a - b);
}

export async function getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("top_scores")
    .select("*")
    .order("best_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  return (data || []).map((entry) => ({
    id: entry.id,
    display_name: entry.display_name || "Anonymous",
    avatar_url: entry.avatar_url,
    spotify_id: entry.spotify_id,
    score: entry.best_score,
    correct_answers: entry.best_correct,
    completed_at: new Date().toISOString(),
  }));
}
