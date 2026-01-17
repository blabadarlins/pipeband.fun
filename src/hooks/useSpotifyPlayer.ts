"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface SpotifyPlayerState {
  isReady: boolean;
  isPlaying: boolean;
  currentTrack: string | null;
  error: string | null;
}

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export function useSpotifyPlayer(accessToken: string | null) {
  const [state, setState] = useState<SpotifyPlayerState>({
    isReady: false,
    isPlaying: false,
    currentTrack: null,
    error: null,
  });
  
  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    // Load Spotify SDK script
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "pipeband.fun Quiz Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Spotify Player ready with Device ID", device_id);
        deviceIdRef.current = device_id;
        setState((prev) => ({ ...prev, isReady: true }));
      });

      player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.log("Device ID has gone offline", device_id);
        setState((prev) => ({ ...prev, isReady: false }));
      });

      player.addListener("player_state_changed", (state: any) => {
        if (!state) return;
        setState((prev) => ({
          ...prev,
          isPlaying: !state.paused,
          currentTrack: state.track_window?.current_track?.uri || null,
        }));
      });

      player.addListener("initialization_error", ({ message }: { message: string }) => {
        console.error("Initialization error:", message);
        setState((prev) => ({ ...prev, error: message }));
      });

      player.addListener("authentication_error", ({ message }: { message: string }) => {
        console.error("Authentication error:", message);
        setState((prev) => ({ ...prev, error: message }));
      });

      player.addListener("account_error", ({ message }: { message: string }) => {
        console.error("Account error:", message);
        setState((prev) => ({ ...prev, error: message }));
      });

      player.connect();
      playerRef.current = player;
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [accessToken]);

  const playTrack = useCallback(
    async (spotifyUri: string) => {
      if (!deviceIdRef.current || !accessToken) {
        console.error("Player not ready or no access token");
        return false;
      }

      try {
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [spotifyUri],
              position_ms: 0,
            }),
          }
        );

        if (!response.ok && response.status !== 204) {
          throw new Error("Failed to play track");
        }

        return true;
      } catch (error) {
        console.error("Error playing track:", error);
        return false;
      }
    },
    [accessToken]
  );

  const pauseTrack = useCallback(async () => {
    if (!deviceIdRef.current || !accessToken) return;

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/pause?device_id=${deviceIdRef.current}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.error("Error pausing track:", error);
    }
  }, [accessToken]);

  const setVolume = useCallback(async (volume: number) => {
    if (playerRef.current) {
      await playerRef.current.setVolume(volume);
    }
  }, []);

  return {
    ...state,
    playTrack,
    pauseTrack,
    setVolume,
  };
}

// Fallback for preview URLs (non-Premium users)
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playPreview = useCallback((previewUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    audio.play();
    audioRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  }, []);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return { isPlaying, playPreview, stopPreview };
}
