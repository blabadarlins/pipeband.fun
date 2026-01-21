"use client";

type CookieOptions = {
  maxAge?: number;
  path?: string;
};

export function getClientCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function setClientCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
) {
  const path = options.path ?? "/";
  const maxAge = options.maxAge ? `; Max-Age=${options.maxAge}` : "";
  document.cookie = `${name}=${value}${maxAge}; path=${path}`;
}

export function deleteClientCookie(name: string) {
  setClientCookie(name, "", { maxAge: 0 });
}
