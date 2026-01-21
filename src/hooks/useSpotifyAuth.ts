"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientCookie, deleteClientCookie } from "@/lib/cookies/client";

interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images?: { url: string }[];
}

export function useSpotifyAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof document === "undefined") return null;
    return getClientCookie("spotify_access_token");
  });
  const [user, setUser] = useState<SpotifyUser | null>(() => {
    if (typeof document === "undefined") return null;
    const userCookie = getClientCookie("spotify_user");
    if (!userCookie) return null;
    try {
      const decoded = decodeURIComponent(userCookie);
      return JSON.parse(decoded) as SpotifyUser;
    } catch {
      return null;
    }
  });
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof document === "undefined") return null;
    return getClientCookie("user_id");
  });
  const isLoading = false;

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access_token);
        return data.access_token;
      } else {
        // Refresh failed, need to re-authenticate
        console.log("Token refresh failed, redirecting to login");
        window.location.href = "/api/auth/spotify";
        return null;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  }, []);

  // Auto-refresh token before expiry (refresh every 45 minutes)
  useEffect(() => {
    if (!accessToken) return;

    const refreshInterval = setInterval(() => {
      refreshToken();
    }, 45 * 60 * 1000); // 45 minutes

    return () => clearInterval(refreshInterval);
  }, [accessToken, refreshToken]);

  const logout = () => {
    deleteClientCookie("spotify_access_token");
    deleteClientCookie("spotify_refresh_token");
    deleteClientCookie("spotify_user");
    deleteClientCookie("user_id");
    setAccessToken(null);
    setUser(null);
    setUserId(null);
    window.location.href = "/";
  };

  return {
    accessToken,
    user,
    userId,
    isLoading,
    isAuthenticated: !!accessToken,
    logout,
    refreshToken,
  };
}
