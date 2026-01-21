import type { cookies as cookiesFn } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof cookiesFn>>;

type SpotifyUserCookie = {
  id: string;
  display_name: string;
  email?: string;
  images?: { url: string }[];
};

const defaultOptions = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export function setSpotifyAccessCookie(
  cookieStore: CookieStore,
  accessToken: string,
  expiresIn: number
) {
  cookieStore.set("spotify_access_token", accessToken, {
    httpOnly: false,
    maxAge: expiresIn,
    ...defaultOptions,
  });
}

export function setSpotifyRefreshCookie(
  cookieStore: CookieStore,
  refreshToken: string
) {
  cookieStore.set("spotify_refresh_token", refreshToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    ...defaultOptions,
  });
}

export function setSpotifyUserCookie(
  cookieStore: CookieStore,
  user: SpotifyUserCookie
) {
  cookieStore.set("spotify_user", JSON.stringify(user), {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    ...defaultOptions,
  });
}

export function setUserIdCookie(cookieStore: CookieStore, userId: string) {
  cookieStore.set("user_id", userId, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    ...defaultOptions,
  });
}
