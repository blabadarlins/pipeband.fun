"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Link from "next/link";

// Congratulatory messages based on score
const messages = {
  high: "You've got more right than a perfectly tuned chanter—well done!",
  medium: "No false fingering here—just pure piping knowledge!",
  low: "Your trivia score is like an early E, time to study!",
};

function ClockIcon() {
  return (
    <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M20 10V20L26 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M12 20L18 26L28 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C13.1 2 14 2.9 14 4H19C19.55 4 20 4.45 20 5V8C20 9.66 18.66 11 17 11H16.9C16.44 13.28 14.42 15 12 15C9.58 15 7.56 13.28 7.1 11H7C5.34 11 4 9.66 4 8V5C4 4.45 4.45 4 5 4H10C10 2.9 10.9 2 12 2ZM6 6V8C6 8.55 6.45 9 7 9H7.04C7.02 8.67 7 8.34 7 8V6H6ZM17 6H17V8C17 8.34 16.98 8.67 16.96 9H17C17.55 9 18 8.55 18 8V6ZM12 17C14.21 17 16 18.79 16 21H8C8 18.79 9.79 17 12 17Z"/>
    </svg>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  
  const correct = parseInt(searchParams.get("correct") || "0");
  const total = parseInt(searchParams.get("total") || "10");
  const timeSeconds = parseInt(searchParams.get("time") || "0");

  const percentage = (correct / total) * 100;
  const message = percentage >= 70 ? messages.high : percentage >= 50 ? messages.medium : messages.low;

  const minutes = Math.floor(timeSeconds / 60);
  const seconds = timeSeconds % 60;
  const timeDisplay = minutes > 0 
    ? `${minutes} min ${seconds} sec` 
    : `${seconds} sec`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-lg mx-auto text-center">
          {/* Avatar placeholder */}
          <div className="w-24 h-24 rounded-full bg-accent/20 border-4 border-accent mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">🎵</span>
          </div>

          <h1 className="heading-lg mb-8">Congrats!</h1>

          {/* Stats */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="bg-accent/10 rounded-full px-6 py-4 flex items-center gap-3">
              <span className="text-accent">
                <ClockIcon />
              </span>
              <span className="heading-md">{timeDisplay}</span>
            </div>
            <div className="bg-accent/10 rounded-full px-6 py-4 flex items-center gap-3">
              <span className="text-accent">
                <CheckIcon />
              </span>
              <span className="heading-md">{correct}/{total}</span>
            </div>
          </div>

          {/* Message */}
          <p className="text-body mb-10">&ldquo;{message}&rdquo;</p>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button variant="facebook" icon={<FacebookIcon />}>
              Share on Facebook
            </Button>
            <Link href="/leaderboard">
              <Button variant="primary" icon={<TrophyIcon />}>
                View Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
