"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingState from "@/components/LoadingState";
import { getLeaderboard } from "@/lib/supabase/queries";
import type { LeaderboardEntry } from "@/types";

function TrophyIcon({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-600",
  };

  if (rank > 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
        {rank}
      </div>
    );
  }

  return (
    <div className={`w-8 h-8 flex items-center justify-center ${colors[rank]}`}>
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C13.1 2 14 2.9 14 4H19C19.55 4 20 4.45 20 5V8C20 9.66 18.66 11 17 11H16.9C16.44 13.28 14.42 15 12 15C9.58 15 7.56 13.28 7.1 11H7C5.34 11 4 9.66 4 8V5C4 4.45 4.45 4 5 4H10C10 2.9 10.9 2 12 2ZM6 6V8C6 8.55 6.45 9 7 9H7.04C7.02 8.67 7 8.34 7 8V6H6ZM17 6H17V8C17 8.34 16.98 8.67 16.96 9H17C17.55 9 18 8.55 18 8V6ZM12 17C14.21 17 16 18.79 16 21H8C8 18.79 9.79 17 12 17Z"/>
      </svg>
    </div>
  );
}

function LeaderboardRow({ 
  rank, 
  name, 
  username, 
  score, 
  avatarUrl,
  isTopThree 
}: { 
  rank: number; 
  name: string; 
  username: string; 
  score: number;
  avatarUrl: string | null;
  isTopThree: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl ${isTopThree ? "bg-white" : ""}`}>
      <TrophyIcon rank={rank} />
      
      {/* Avatar */}
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={name}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-grey-2 flex items-center justify-center text-grey text-sm font-bold">
          {name.charAt(0)}
        </div>
      )}
      
      <div className="flex-1">
        <p className="font-bold text-blue">{name}</p>
        <p className="text-sm text-grey">@{username}</p>
      </div>
      
      <p className={`font-bold ${isTopThree ? "text-accent text-lg" : "text-blue"}`}>
        {score}pts
      </p>
    </div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setIsLoading(true);
      try {
        const data = await getLeaderboard(50);
        setLeaderboard(data);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      }
      setIsLoading(false);
    }
    
    loadLeaderboard();
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Title */}
            <div className="lg:w-1/3">
              <h1 className="heading-lg">Leaderboard</h1>
            </div>

            {/* Leaderboard list */}
            <div className="lg:w-2/3">
              {isLoading ? (
                <LoadingState
                  fullScreen={false}
                  message="Loading leaderboard..."
                  className="text-center py-12"
                />
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-body mb-2">No scores yet!</p>
                  <p className="text-small">Be the first to play and get on the leaderboard.</p>
                </div>
              ) : (
                <>
                  {/* Top 3 */}
                  <div className="space-y-2 mb-4">
                    {topThree.map((entry, index) => (
                      <LeaderboardRow
                        key={entry.id}
                        rank={index + 1}
                        name={entry.display_name}
                        username={entry.spotify_id}
                        score={entry.score}
                        avatarUrl={entry.avatar_url}
                        isTopThree={true}
                      />
                    ))}
                  </div>

                  {rest.length > 0 && (
                    <>
                      {/* Divider */}
                      <div className="border-t-2 border-dashed border-grey-2 my-6" />

                      {/* Rest of leaderboard */}
                      <div className="space-y-2">
                        {rest.map((entry, index) => (
                          <LeaderboardRow
                            key={entry.id}
                            rank={index + 4}
                            name={entry.display_name}
                            username={entry.spotify_id}
                            score={entry.score}
                            avatarUrl={entry.avatar_url}
                            isTopThree={false}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
