import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function upsertUserServer(spotifyUser: {
  id: string;
  display_name: string;
  email?: string;
  images?: { url: string }[];
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        spotify_id: spotifyUser.id,
        display_name: spotifyUser.display_name,
        email: spotifyUser.email,
        avatar_url: spotifyUser.images?.[0]?.url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "spotify_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting user:", error);
    return null;
  }

  return data;
}
