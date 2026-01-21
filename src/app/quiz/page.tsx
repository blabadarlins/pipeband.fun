"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import Timer from "@/components/Timer";
import OptionPill from "@/components/OptionPill";
import Button from "@/components/Button";
import SpotifyPlayer, { pauseSpotifyPlayer } from "@/components/SpotifyPlayer";
import LoadingState from "@/components/LoadingState";
import { useRouter } from "next/navigation";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { getRandomTracks, getAllBandNames, getAllYears } from "@/lib/supabase/queries";
import type { Track } from "@/types";

const TOTAL_TIME = 30;
const TOTAL_QUESTIONS = 10;

function generateOptions<T>(correct: T, allOptions: T[], count: number = 4): T[] {
  const options = new Set<T>([correct]);
  const available = allOptions.filter((o) => o !== correct);
  
  while (options.size < count && available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length);
    options.add(available[randomIndex]);
    available.splice(randomIndex, 1);
  }
  
  return Array.from(options).sort(() => Math.random() - 0.5);
}

export default function QuizPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useSpotifyAuth();
  
  // Game state
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [allBands, setAllBands] = useState<string[]>([]);
  const [allYears, setAllYears] = useState<number[]>([]);
  
  // Player state
  const [playerReady, setPlayerReady] = useState(false);
  const [playerActivated, setPlayerActivated] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  // Question state
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Score state
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  
  // Exit modal state
  const [showExitModal, setShowExitModal] = useState(false);

  const currentTrack = tracks[currentQuestion];
  const canContinue = selectedBand !== null && selectedYear !== null;

  // Redirect to Spotify login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/api/auth/spotify");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load tracks from Supabase
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [fetchedTracks, bands, years] = await Promise.all([
          getRandomTracks(TOTAL_QUESTIONS),
          getAllBandNames(),
          getAllYears(),
        ]);
        
        setTracks(fetchedTracks);
        setAllBands(bands);
        setAllYears(years);
      } catch (error) {
        console.error("Error loading quiz data:", error);
      }
      setIsLoading(false);
    }
    
    loadData();
  }, []);

  const bandOptions = useMemo(() => {
    if (!currentTrack || allBands.length === 0) return [];
    return generateOptions(currentTrack.band_name, allBands, 4);
  }, [currentTrack, allBands]);

  const yearOptions = useMemo(() => {
    if (!currentTrack || allYears.length === 0) return [];
    return generateOptions(currentTrack.year, allYears, 4);
  }, [currentTrack, allYears]);

  const handleContinue = useCallback(async () => {
    const timeTaken = TOTAL_TIME - timeRemaining;
    const newTotalTime = totalTimeTaken + timeTaken;
    setTotalTimeTaken(newTotalTime);

    // Check if answers are correct
    let newScore = score;
    let newCorrect = correctAnswers;
    
    if (currentTrack) {
      const bandCorrect = selectedBand === currentTrack.band_name;
      const yearCorrect = selectedYear === currentTrack.year;
      
      if (bandCorrect && yearCorrect) {
        const basePoints = 100;
        const timeBonus = Math.floor(timeRemaining * 5);
        newScore = score + basePoints + timeBonus;
        newCorrect = correctAnswers + 1;
        setScore(newScore);
        setCorrectAnswers(newCorrect);
      }
    }

    // Move to next question or finish
    if (currentQuestion < tracks.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedBand(null);
      setSelectedYear(null);
      setTimeRemaining(TOTAL_TIME);
      setPlayerError(null); // Clear any playback errors
    } else {
      // Quiz complete - stop the music and save the game session
      pauseSpotifyPlayer();
      
      // Save game session to database via API (server-side for reliable RLS handling)
      try {
        const response = await fetch("/api/game/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: newScore,
            correctAnswers: newCorrect,
            totalQuestions: tracks.length,
            timeTakenSeconds: newTotalTime,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log("Game session saved:", result.id);
        } else {
          const error = await response.json();
          console.error("Failed to save game session:", error);
        }
      } catch (error) {
        console.error("Failed to save game session:", error);
      }
      
      const params = new URLSearchParams({
        score: newScore.toString(),
        correct: newCorrect.toString(),
        total: tracks.length.toString(),
        time: newTotalTime.toString(),
      });
      router.push(`/results?${params.toString()}`);
    }
  }, [currentQuestion, selectedBand, selectedYear, timeRemaining, currentTrack, score, correctAnswers, totalTimeTaken, tracks.length, router]);

  // Timer logic - pauses when exit modal is shown
  useEffect(() => {
    if (!gameStarted || !playerReady || timeRemaining <= 0 || showExitModal) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleContinue();
          return TOTAL_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, playerReady, timeRemaining, showExitModal, handleContinue]);

  // Auth loading
  if (authLoading) {
    return <LoadingState message="Loading..." className="bg-white" />;
  }

  // Not authenticated - show loading while redirecting
  if (!isAuthenticated) {
    return <LoadingState message="Redirecting to Spotify login..." className="bg-white" />;
  }

  // Loading tracks
  if (isLoading) {
    return <LoadingState message="Loading quiz..." className="bg-white" />;
  }

  // No tracks available
  if (tracks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="heading-lg mb-4">No tracks available</h1>
            <p className="text-body mb-8">
              The quiz database is empty. Please import tracks first.
            </p>
            <Button variant="primary" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Pre-game screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="heading-lg mb-8">Are you ready to start?</h1>
            
            <p className="text-body mb-4">
              You&apos;ll hear {tracks.length} audio clips from well-known pipe band medleys. 
              Your job is to identify the correct <strong className="text-blue">band</strong> and <strong className="text-blue">year</strong> before time runs out! 
              The faster you answer, the higher your score.
            </p>
            
            <p className="text-body mb-4">
              Correct answers earn you points. Faster responses get you bonus points. 
              Score over 50% correct, and you&apos;ll get a special congratulations message!
            </p>
            
            <p className="text-body mb-8">
              Make sure your Spotify is not playing on another device.
            </p>

            {playerError && (
              <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6">
                {playerError}
              </div>
            )}

            {/* Initialize Spotify Player and require activation before starting */}
            <div className="flex flex-col items-center gap-6">
              {accessToken && (
                <SpotifyPlayer
                  accessToken={accessToken}
                  trackUri={playerActivated ? (currentTrack?.spotify_uri || null) : null}
                  onReady={() => setPlayerReady(true)}
                  onError={(error) => setPlayerError(error)}
                  onActivate={() => {
                    setPlayerActivated(true);
                    setGameStarted(true);
                  }}
                />
              )}
              
              {playerActivated && (
                <Button variant="primary" onClick={() => setGameStarted(true)}>
                  Let&apos;s go!
                </Button>
              )}
              
              {!playerActivated && playerReady && (
                <p className="text-small text-grey">
                  Click the play button above to enable audio
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleExitClick = () => {
    setShowExitModal(true);
    pauseSpotifyPlayer();
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  const handleConfirmExit = () => {
    pauseSpotifyPlayer();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-xl">
            <h2 className="heading-md text-center mb-4">Exit Quiz?</h2>
            <p className="text-body text-center mb-8">
              Are you sure you want to exit? Your progress will be lost.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="secondary" onClick={handleCancelExit}>
                Keep Playing
              </Button>
              <Button variant="primary" onClick={handleConfirmExit}>
                Exit Quiz
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-3xl mx-auto relative">
          {/* Exit button */}
          <button
            onClick={handleExitClick}
            className="absolute left-0 top-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Exit quiz"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          
          {/* Progress indicator */}
          <div className="text-center mb-4">
            <span className="text-small">
              Question {currentQuestion + 1} of {tracks.length}
            </span>
          </div>

          {/* Timer */}
          <div className="flex justify-center mb-8">
            <Timer timeRemaining={timeRemaining} totalTime={TOTAL_TIME} />
          </div>

          {/* Spotify Player */}
          <div className="flex justify-center mb-6">
            {accessToken && (
              <SpotifyPlayer
                accessToken={accessToken}
                trackUri={currentTrack?.spotify_uri || null}
                onReady={() => setPlayerReady(true)}
                onError={(error) => setPlayerError(error)}
                onActivate={() => setPlayerActivated(true)}
              />
            )}
          </div>

          {playerError && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
              {playerError}
              <button 
                onClick={() => {
                  setPlayerError(null);
                  handleContinue();
                }}
                className="ml-4 underline font-bold"
              >
                Skip this track
              </button>
            </div>
          )}

          {/* Question */}
          <h1 className="heading-lg text-center mb-12">
            Guess the band and year.
          </h1>

          {/* Band Options */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {bandOptions.map((band) => (
              <OptionPill
                key={band}
                label={band}
                selected={selectedBand === band}
                onClick={() => setSelectedBand(band)}
              />
            ))}
          </div>

          {/* Year Options */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {yearOptions.map((year) => (
              <OptionPill
                key={year}
                label={year.toString()}
                selected={selectedYear === year}
                onClick={() => setSelectedYear(year)}
              />
            ))}
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <Button
              variant={canContinue ? "primary" : "disabled"}
              disabled={!canContinue}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
