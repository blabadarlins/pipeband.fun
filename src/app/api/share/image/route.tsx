import { ImageResponse } from "next/og";

export const runtime = "edge";

// Congratulatory messages based on score
const messages = {
  high: "You've got more right than a perfectly tuned chanter—well done!",
  medium: "No false fingering here—just pure piping knowledge!",
  low: "Your trivia score is like an early E, time to study!",
};

function getMessage(correct: number, total: number): string {
  const percentage = (correct / total) * 100;
  if (percentage >= 70) return messages.high;
  if (percentage >= 50) return messages.medium;
  return messages.low;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return `${minutes} min ${secs} sec`;
  }
  return `${seconds} seconds`;
}

// Helper function to fetch font from Google Fonts
async function fetchGoogleFont(fontFamily: string, weight: number = 400): Promise<ArrayBuffer> {
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weight}&display=swap`;
  
  const css = await fetch(fontUrl, {
    headers: {
      // Use an older user agent to get woff format (not woff2) which is supported by satori
      "User-Agent": "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
    },
  }).then((res) => res.text());

  // Extract the font URL from the CSS - look for woff format
  const fontUrlMatch = css.match(/src: url\(([^)]+)\) format\('woff'\)/);
  if (!fontUrlMatch) {
    throw new Error(`Could not find font URL for ${fontFamily}`);
  }

  return fetch(fontUrlMatch[1]).then((res) => res.arrayBuffer());
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const time = parseInt(searchParams.get("time") || "0");
  const correct = parseInt(searchParams.get("correct") || "0");
  const total = parseInt(searchParams.get("total") || "10");
  const avatar = searchParams.get("avatar") || "";

  // Fetch fonts from Google Fonts API
  const [fredokaData, knewaveData, nunitoData] = await Promise.all([
    fetchGoogleFont("Fredoka", 700),
    fetchGoogleFont("Knewave", 400),
    fetchGoogleFont("Nunito", 900),
  ]);

  // Fetch avatar image server-side to avoid CORS issues
  let avatarDataUrl: string | null = null;
  if (avatar) {
    try {
      const avatarResponse = await fetch(avatar);
      if (avatarResponse.ok) {
        const buffer = await avatarResponse.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const contentType = avatarResponse.headers.get("content-type") || "image/jpeg";
        avatarDataUrl = `data:${contentType};base64,${base64}`;
      }
    } catch (e) {
      console.error("Failed to fetch avatar:", e);
    }
  }

  const message = getMessage(correct, total);
  const timeDisplay = formatTime(time);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#41b9ff",
          padding: "40px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: "40px",
          }}
        >
          <span
            style={{
              fontFamily: "Fredoka",
              fontSize: "52px",
              fontWeight: 700,
              color: "#040321",
            }}
          >
            pipeband
          </span>
          <span
            style={{
              fontFamily: "Knewave",
              fontSize: "48px",
              color: "#ffffff",
            }}
          >
            .fun
          </span>
        </div>

        {/* Avatar */}
        {avatarDataUrl ? (
          <img
            src={avatarDataUrl}
            width={140}
            height={140}
            style={{
              borderRadius: 70,
              marginBottom: 30,
              border: "6px solid #ffffff",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          />
        ) : (
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: "#e1e4ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 30,
              fontSize: 50,
              border: "6px solid #ffffff",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            🎵
          </div>
        )}

        {/* Time */}
        <div
          style={{
            display: "flex",
            fontFamily: "Nunito",
            fontSize: "56px",
            fontWeight: 900,
            color: "#ffffff",
            marginBottom: "20px",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          {timeDisplay}
        </div>

        {/* Message */}
        <div
          style={{
            display: "flex",
            fontFamily: "Nunito",
            fontSize: "24px",
            fontWeight: 500,
            color: "#ffffff",
            textAlign: "center",
            maxWidth: "580px",
            lineHeight: 1.4,
            marginBottom: "60px",
          }}
        >
          {`"${message}"`}
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            fontFamily: "Nunito",
            fontSize: "20px",
            fontWeight: 500,
            color: "#ffffff",
            opacity: 0.9,
          }}
        >
          <span>Take the test over at —&nbsp;</span>
          <span style={{ fontWeight: 700 }}>www.pipeband.fun</span>
        </div>
      </div>
    ),
    {
      width: 720,
      height: 720,
      fonts: [
        {
          name: "Fredoka",
          data: fredokaData,
          weight: 700,
          style: "normal",
        },
        {
          name: "Knewave",
          data: knewaveData,
          weight: 400,
          style: "normal",
        },
        {
          name: "Nunito",
          data: nunitoData,
          weight: 900,
          style: "normal",
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
