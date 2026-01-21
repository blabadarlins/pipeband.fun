import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const isDebug = process.env.NODE_ENV !== "production";
const debugLog = (...args: unknown[]) => {
  if (isDebug) {
    console.log(...args);
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { score, correctAnswers, totalQuestions, timeTakenSeconds } = body;

    // Get user_id from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      console.error("No user_id cookie found");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    debugLog("Saving game session for user:", userId);
    debugLog("Score:", score, "Correct:", correctAnswers);

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("game_sessions")
      .insert({
        user_id: userId,
        score,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        time_taken_seconds: timeTakenSeconds,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving game session:", error);
      return NextResponse.json(
        { error: "Failed to save game session", details: error.message },
        { status: 500 }
      );
    }

    debugLog("Game session saved successfully:", data.id);
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Unexpected error saving game session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
