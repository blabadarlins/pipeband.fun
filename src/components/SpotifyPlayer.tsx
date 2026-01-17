"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SpotifyPlayerProps {
  accessToken: string;
  trackUri: string | null;
  onReady?: () => void;
  onError?: (error: string) => void;
  onPlaybackChange?: (isPlaying: boolean) => void;
}

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export default function SpotifyPlayer({
  accessToken,
  trackUri,
  onReady,
  onError,
  onPlaybackChange,
}: SpotifyPlayerProps) {
  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(false);

  // Load Spotify SDK
  useEffect(() => {
    if (window.Spotify) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setSdkLoaded(true);
    };

    return () => {
      // Don't remove script on cleanup
    };
  }, []);

  // Initialize player when SDK is loaded
  useEffect(() => {
    if (!sdkLoaded || !accessToken || playerRef.current) return;

    const player = new window.Spotify.Player({
      name: "pipeband.fun Quiz",
      getOAuthToken: (cb: (token: string) => void) => {
        cb(accessToken);
      },
      volume: 0.5,
    });

    player.addListener("ready", async ({ device_id }: { device_id: string }) => {
      console.log("Spotify Player ready with Device ID:", device_id);
      deviceIdRef.current = device_id;
      // Wait a bit for Spotify's API to register the device
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsReady(true);
      onReady?.();
    });

    player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
      console.log("Device ID has gone offline:", device_id);
      setIsReady(false);
    });

    player.addListener("player_state_changed", (state: any) => {
      if (!state) return;
      const playing = !state.paused;
      setIsPlaying(playing);
      onPlaybackChange?.(playing);
    });

    player.addListener("initialization_error", ({ message }: { message: string }) => {
      console.error("Spotify initialization error:", message);
      onError?.(message);
    });

    player.addListener("authentication_error", ({ message }: { message: string }) => {
      console.error("Spotify authentication error:", message);
      onError?.("Session expired. Refreshing...");
      // Try to refresh the token
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
      onError?.("Spotify Premium is required for playback.");
    });

    player.addListener("playback_error", ({ message }: { message: string }) => {
      console.error("Spotify playback error:", message);
      onError?.(message);
    });

    player.connect().then((success: boolean) => {
      if (success) {
        console.log("Spotify Player connected successfully");
      }
    });

    playerRef.current = player;

    return () => {
      player.disconnect();
      playerRef.current = null;
    };
  }, [sdkLoaded, accessToken, onReady, onError, onPlaybackChange]);

  // Poll for device availability
  const waitForDevice = useCallback(async (maxAttempts: number = 10): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`Checking for device... attempt ${i + 1}/${maxAttempts}`);
      
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const ourDevice = data.devices.find(
          (d: any) => d.id === deviceIdRef.current
        );
        
        if (ourDevice) {
          console.log("Device found:", ourDevice.name);
          return true;
        }
      }
      
      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    
    return false;
  }, [accessToken]);

  // Play track when trackUri changes
  useEffect(() => {
    if (!isReady || !trackUri || !deviceIdRef.current) return;

    let cancelled = false;

    const playTrack = async () => {
      try {
        console.log("Attempting to play track:", trackUri);
        console.log("Device ID:", deviceIdRef.current);

        // Wait for our device to appear in Spotify's device list
        const deviceFound = await waitForDevice();
        
        if (cancelled) return;
        
        if (!deviceFound) {
          console.error("Device never appeared in device list");
          onError?.("Spotify player not ready. Please refresh the page.");
          return;
        }

        // Try to play directly with retries
        let lastError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          if (cancelled) return;
          
          console.log(`Play attempt ${attempt + 1}/3`);
          
          const response = await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                uris: [trackUri],
                position_ms: 0,
              }),
            }
          );

          console.log("Play response:", response.status);

          if (response.ok || response.status === 204) {
            console.log("Playback started successfully!");
            return; // Success!
          }

          const errorData = await response.json().catch(() => ({}));
          lastError = { status: response.status, data: errorData };
          console.log("Play error, will retry:", response.status, errorData);

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // All retries failed
        if (lastError) {
          console.error("All play attempts failed:", lastError);
          if (lastError.status === 403) {
            onError?.("Spotify Premium required for playback");
          } else if (lastError.status === 404) {
            // Device needs activation - requires user click
            console.log("Device not active, needs user activation");
            setNeedsActivation(true);
          } else if (lastError.data?.error?.message) {
            onError?.(lastError.data.error.message);
          } else {
            onError?.("Failed to play track");
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Error playing track:", error);
        onError?.("Failed to connect to Spotify");
      }
    };

    // Only auto-play if already activated
    if (isActivated) {
      playTrack();
    } else {
      // Check if we need activation
      waitForDevice().then(found => {
        if (found && !isActivated) {
          setNeedsActivation(true);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isReady, trackUri, accessToken, onError, waitForDevice, isActivated]);

  // Handle user clicking to activate playback
  const handleActivate = useCallback(async () => {
    if (!playerRef.current || !trackUri) return;

    try {
      // Activate the player element (required for browser autoplay policy)
      await playerRef.current.activateElement();
      console.log("Player activated by user click");
      
      setIsActivated(true);
      setNeedsActivation(false);

      // Now play the track
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [trackUri],
            position_ms: 0,
          }),
        }
      );

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Play after activation failed:", response.status, errorData);
        onError?.("Could not start playback. Try refreshing the page.");
      } else {
        console.log("Playback started after user activation!");
      }
    } catch (error) {
      console.error("Activation error:", error);
      onError?.("Could not activate Spotify player");
    }
  }, [accessToken, trackUri, onError]);

  // Pause on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.pause();
      }
    };
  }, []);

  if (needsActivation) {
    return (
      <button
        onClick={handleActivate}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors animate-pulse"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>Click to Play Music</span>
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
