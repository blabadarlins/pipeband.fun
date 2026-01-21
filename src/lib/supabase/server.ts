import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const isDebug = process.env.NODE_ENV !== "production";
const debugLog = (...args: unknown[]) => {
  if (isDebug) {
    console.log(...args);
  }
};

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

// Admin client with service role key - bypasses RLS for server-side operations
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function upsertUserServer(spotifyUser: {
  id: string;
  display_name: string;
  email?: string;
  images?: { url: string }[];
}) {
  // Check if required environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  debugLog("upsertUserServer called for spotify_id:", spotifyUser.id);
  debugLog("SUPABASE_URL set:", !!supabaseUrl);
  debugLog("SERVICE_ROLE_KEY set:", !!serviceRoleKey);
  debugLog("SERVICE_ROLE_KEY length:", serviceRoleKey?.length || 0);
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("CRITICAL: Missing Supabase environment variables!");
    console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "set" : "MISSING");
    console.error("SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey ? "set" : "MISSING");
    return null;
  }

  try {
    // Use admin client to bypass RLS for user creation
    const supabase = createAdminClient();
    
    const userData = {
      spotify_id: spotifyUser.id,
      display_name: spotifyUser.display_name,
      email: spotifyUser.email,
      avatar_url: spotifyUser.images?.[0]?.url || null,
      updated_at: new Date().toISOString(),
    };
    
    debugLog("Attempting upsert with data:", JSON.stringify(userData));
    
    const { data, error } = await supabase
      .from("users")
      .upsert(userData, { onConflict: "spotify_id" })
      .select()
      .single();

    if (error) {
      console.error("Supabase upsert error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    debugLog("User upsert successful, id:", data?.id);
    return data;
  } catch (err) {
    console.error("upsertUserServer threw exception:", err);
    return null;
  }
}
