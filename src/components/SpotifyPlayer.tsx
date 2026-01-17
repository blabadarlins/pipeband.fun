"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SpotifyPlayerProps {
  accessToken: string;
  trackUri: string | null;
  onReady?: () => void;
  onError?: (error: string) => void;
  onPlaybackChange?: (isPlaying: boolean) => void;
  onActivate?: () => void;
}

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

// Singleton pattern - prevent multiple player instances
let globalPlayer: any = null;
let globalDeviceId: string | null = null;
let isPlayerInitializing = false;
let isPlayerActivated = false;

export default function SpotifyPlayer({
  accessToken,
  trackUri,
  onReady,
  onError,
  onPlaybackChange,
  onActivate,
}: SpotifyPlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isActivated, setIsActivated] = useState(isPlayerActivated);
  const [needsActivation, setNeedsActivation] = useState(false);
  const currentTrackRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Load Spotify SDK (only once)
  useEffect(() => {
    if (window.Spotify) {
      setSdkLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
    if (existingScript) {
      // Wait for it to load
      window.onSpotifyWebPlaybackSDKReady = () => {
        setSdkLoaded(true);
      };
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setSdkLoaded(true);
    };
  }, []);

  // Initialize player when SDK is loaded (singleton)
  useEffect(() => {
    if (!sdkLoaded || !accessToken) return;
    
    // If we already have a global player with a device ID, reuse it
    if (globalPlayer && globalDeviceId) {
      console.log("Reusing existing Spotify player, device:", globalDeviceId);
      setIsReady(true);
      onReady?.();
      return;
    }

    // Prevent multiple initialization attempts
    if (isPlayerInitializing) {
      console.log("Player already initializing, skipping...");
      return;
    }

    isPlayerInitializing = true;
    console.log("Initializing new Spotify player...");

    const player = new window.Spotify.Player({
      name: "pipeband.fun Quiz",
      getOAuthToken: (cb: (token: string) => void) => {
        cb(accessToken);
      },
      volume: 0.5,
    });

    player.addListener("ready", ({ device_id }: { device_id: string }) => {
      console.log("Spotify Player ready with Device ID:", device_id);
      globalDeviceId = device_id;
      globalPlayer = player;
      isPlayerInitializing = false;
      
      if (mountedRef.current) {
        setIsReady(true);
        // Show activation button immediately - browser requires user interaction
        setNeedsActivation(true);
        onReady?.();
      }
    });

    player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
      console.log("Device ID has gone offline:", device_id);
      if (mountedRef.current) {
        setIsReady(false);
      }
    });

    player.addListener("player_state_changed", (state: any) => {
      if (!state || !mountedRef.current) return;
      const playing = !state.paused;
      setIsPlaying(playing);
      onPlaybackChange?.(playing);
    });

    player.addListener("initialization_error", ({ message }: { message: string }) => {
      console.error("Spotify initialization error:", message);
      isPlayerInitializing = false;
      onError?.(message);
    });

    player.addListener("authentication_error", ({ message }: { message: string }) => {
      console.error("Spotify authentication error:", message);
      isPlayerInitializing = false;
      onError?.("Session expired. Refreshing...");
      fetch("/api/auth/refresh", { method: "POST" })
        .then((res) => {
          if (res.ok) {
            window.location.reload();
          } else {
            window.location.href = "/api/auth/spotify";
          }
        })
        .catch(() => {
          window.location.href = "/api/auth/spotify";
        });
    });

    player.addListener("account_error", ({ message }: { message: string }) => {
      console.error("Spotify account error:", message);
      isPlayerInitializing = false;
      onError?.("Spotify Premium is required for playback.");
    });

    player.addListener("playback_error", ({ message }: { message: string }) => {
      console.error("Spotify playback error:", message);
      onError?.(message);
    });

    player.connect().then((success: boolean) => {
      if (success) {
        console.log("Spotify Player connected successfully");
      } else {
        console.error("Spotify Player failed to connect");
        isPlayerInitializing = false;
      }
    });

    // Cleanup only marks as unmounted, don't disconnect the singleton
    return () => {
      mountedRef.current = false;
    };
  }, [sdkLoaded, accessToken, onReady, onError, onPlaybackChange]);

  // Reset mounted ref when component remounts
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Play track with exponential backoff for rate limiting
  const playTrackWithRetry = useCallback(async (
    uri: string, 
    attempt: number = 0
  ): Promise<boolean> => {
    const maxAttempts = 3;
    const baseDelay = 2000;

    if (!globalDeviceId) {
      console.error("No device ID available");
      return false;
    }

    try {
      console.log(`Play attempt ${attempt + 1}/${maxAttempts} for track:`, uri);
      
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${globalDeviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [uri],
            position_ms: 0,
          }),
        }
      );

      console.log("Play response status:", response.status);

      // Success
      if (response.ok || response.status === 204) {
        console.log("Playback started successfully!");
        return true;
      }

      // Rate limited - use Retry-After header or exponential backoff
      if (response.status === 429) {
        if (attempt >= maxAttempts - 1) {
          console.error("Max retry attempts reached after rate limiting");
          onError?.("Spotify is rate limiting requests. Please wait a moment and try again.");
          return false;
        }

        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : baseDelay * Math.pow(2, attempt);
        
        console.log(`Rate limited. Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return playTrackWithRetry(uri, attempt + 1);
      }

      // Handle other errors
      const errorData = await response.json().catch(() => ({}));
      console.error("Play error:", response.status, errorData);

      if (response.status === 403) {
        onError?.("Spotify Premium required for playback");
        return false;
      }

      if (response.status === 404) {
        // Device not found - might need re-activation
        if (attempt < maxAttempts - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Device not found. Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return playTrackWithRetry(uri, attempt + 1);
        }
        onError?.("Spotify player not found. Please refresh the page.");
        return false;
      }

      if (errorData?.error?.message) {
        onError?.(errorData.error.message);
      } else {
        onError?.("Failed to play track");
      }
      
      return false;
    } catch (error) {
      console.error("Error playing track:", error);
      onError?.("Failed to connect to Spotify");
      return false;
    }
  }, [accessToken, onError]);

  // Play track when trackUri changes (only if activated)
  useEffect(() => {
    if (!isReady || !trackUri || !isActivated) return;
    
    // Avoid replaying the same track
    if (currentTrackRef.current === trackUri) return;
    currentTrackRef.current = trackUri;

    playTrackWithRetry(trackUri);
  }, [isReady, trackUri, isActivated, playTrackWithRetry]);

  // Handle user clicking to activate playback
  const handleActivate = useCallback(async () => {
    if (!globalPlayer) {
      console.error("No player available for activation");
      return;
    }

    try {
      // Activate the player element (required for browser autoplay policy)
      await globalPlayer.activateElement();
      console.log("Player activated by user click");
      
      isPlayerActivated = true;
      setIsActivated(true);
      setNeedsActivation(false);
      onActivate?.();

      // If we have a track URI, play it now
      if (trackUri && globalDeviceId) {
        currentTrackRef.current = trackUri;
        await playTrackWithRetry(trackUri);
      }
    } catch (error) {
      console.error("Activation error:", error);
      onError?.("Could not activate Spotify player");
    }
  }, [trackUri, onError, onActivate, playTrackWithRetry]);

  // Expose activation function for parent components
  useEffect(() => {
    if (globalPlayer && !isActivated && isReady) {
      // Make activation available
      (window as any).__activateSpotifyPlayer = handleActivate;
    }
    return () => {
      delete (window as any).__activateSpotifyPlayer;
    };
  }, [handleActivate, isActivated, isReady]);

  if (needsActivation && !isActivated) {
    return (
      <button
        onClick={handleActivate}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors animate-pulse"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>Start Playing</span>
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-accent/10">
      <span className={`w-3 h-3 rounded-full ${isPlaying ? "bg-accent animate-pulse" : isReady ? "bg-green-500" : "bg-grey"}`}></span>
      <span className="text-small">
        {!isReady ? "Connecting to Spotify..." : isPlaying ? "Now playing..." : "Ready"}
      </span>
    </div>
  );
}

// Export a function to manually trigger activation from other components
export function activateSpotifyPlayer(): Promise<void> {
  const activate = (window as any).__activateSpotifyPlayer;
  if (activate) {
    return activate();
  }
  return Promise.resolve();
}
