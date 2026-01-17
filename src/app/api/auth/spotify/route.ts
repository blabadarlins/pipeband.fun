import { redirect } from "next/navigation";
import { getSpotifyAuthUrl } from "@/lib/spotify";

export async function GET() {
  const authUrl = getSpotifyAuthUrl();
  redirect(authUrl);
}
