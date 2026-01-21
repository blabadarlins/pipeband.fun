"use client";

import { useState, useEffect, useCallback } from "react";

interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images?: { url: string }[];
}

export function useSpotifyAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

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

  useEffect(() => {
    const token = getCookie("spotify_access_token");
    const userCookie = getCookie("spotify_user");
    const userIdCookie = getCookie("user_id");

    if (token) {
      setAccessToken(token);
    }

    if (userCookie) {
      try {
        const decoded = decodeURIComponent(userCookie);
        setUser(JSON.parse(decoded));
      } catch (e) {
        console.error("Failed to parse user cookie:", e);
      }
    }

    if (userIdCookie) {
      setUserId(userIdCookie);
    }

    setIsLoading(false);
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
    document.cookie = "spotify_access_token=; Max-Age=0; path=/";
    document.cookie = "spotify_refresh_token=; Max-Age=0; path=/";
    document.cookie = "spotify_user=; Max-Age=0; path=/";
    document.cookie = "user_id=; Max-Age=0; path=/";
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
