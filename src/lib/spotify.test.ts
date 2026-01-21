import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.SPOTIFY_CLIENT_ID = "test-client-id";
  process.env.SPOTIFY_CLIENT_SECRET = "test-client-secret";
  process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI = "http://localhost/callback";
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getSpotifyAuthUrl", () => {
  it("builds a Spotify auth URL with expected params", async () => {
    const { getSpotifyAuthUrl } = await import("./spotify");
    const url = new URL(getSpotifyAuthUrl());

    expect(url.origin).toBe("https://accounts.spotify.com");
    expect(url.pathname).toBe("/authorize");
    expect(url.searchParams.get("client_id")).toBe("test-client-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost/callback");
    expect(url.searchParams.get("scope")).toContain("user-read-private");
  });
});
