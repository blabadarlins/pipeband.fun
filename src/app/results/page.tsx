"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Button from "@/components/Button";
import ShareModal from "@/components/ShareModal";
import Link from "next/link";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";

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
  const { user } = useSpotifyAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  
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

  // Get user avatar URL from Spotify data
  const avatarUrl = user?.images?.[0]?.url || null;

  const fetchShareImage = async (signal?: AbortSignal): Promise<Blob> => {
    const params = new URLSearchParams({
      time: timeSeconds.toString(),
      correct: correct.toString(),
      total: total.toString(),
    });
    
    if (avatarUrl) {
      params.set("avatar", avatarUrl);
    }
    
    const imageUrl = `/api/share/image?${params.toString()}`;
    const response = await fetch(imageUrl, { signal });
    
    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Ensure blob has correct type (should be image/png)
    if (!blob.type.startsWith("image/")) {
      throw new Error(`Invalid image type: ${blob.type}`);
    }
    
    return blob;
  };

  const handleShare = async () => {
    setIsSharing(true);
    setShareError(null);
    
    try {
      // Add timeout to prevent hanging on slow connections
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      // Fetch the generated image
      const blob = await fetchShareImage(controller.signal);
      clearTimeout(timeout);
      
      const file = new File([blob], "pipeband-results.png", { type: "image/png" });
      
      // Check if Web Share API supports sharing files (typically mobile)
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "My pipeband.fun score!",
            text: `I scored ${correct}/${total} in ${timeDisplay} on pipeband.fun!`,
          });
        } catch (shareErr) {
          // If user cancelled, don't show error or fallback
          if ((shareErr as Error).name === "AbortError") {
            return;
          }
          // Native share failed for another reason, show modal as fallback
          setShareImageBlob(blob);
          setShowShareModal(true);
        }
      } else {
        // Desktop or unsupported: show modal with copy/download options
        setShareImageBlob(blob);
        setShowShareModal(true);
      }
    } catch (error) {
      // Handle timeout
      if ((error as Error).name === "AbortError") {
        setShareError("Request timed out. Please try again.");
      } else {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
        setShareError(errorMessage);
      }
      console.error("Share error:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCloseModal = () => {
    setShowShareModal(false);
    setShareImageBlob(null);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="max-w-lg mx-auto text-center">
            {/* User Avatar */}
            <div className="w-24 h-24 rounded-full bg-accent/20 border-4 border-accent mx-auto mb-6 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Your profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">🎵</span>
              )}
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
              <Button 
                variant="facebook" 
                icon={<FacebookIcon />}
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? "Preparing..." : "Share on Facebook"}
              </Button>
              <Link href="/leaderboard">
                <Button variant="primary" icon={<TrophyIcon />}>
                  View Leaderboard
                </Button>
              </Link>
            </div>

            {/* Error Message */}
            {shareError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">
                  {shareError}
                </p>
                <button 
                  onClick={() => setShareError(null)}
                  className="text-red-500 text-xs underline mt-1 block mx-auto"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Share Modal for Desktop */}
      <ShareModal
        isOpen={showShareModal}
        onClose={handleCloseModal}
        imageBlob={shareImageBlob}
        isLoading={false}
      />
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
