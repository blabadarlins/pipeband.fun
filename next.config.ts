import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.scdn.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://*.scdn.co https://*.spotifycdn.com https://i.scdn.co https://*.fbcdn.net",
              "media-src 'self' https://*.scdn.co https://*.spotifycdn.com https://audio-ak.scdn.co",
              "connect-src 'self' https://api.spotify.com https://accounts.spotify.com https://*.supabase.co wss://*.supabase.co https://*.scdn.co",
              "frame-src 'self' https://sdk.scdn.co",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
