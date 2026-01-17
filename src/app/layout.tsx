import type { Metadata } from "next";
import { Fredoka, Knewave, Nunito } from "next/font/google";
import "./globals.css";

// Logo font for "pipeband"
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["700"],
});

// Logo font for ".fun"
const knewave = Knewave({
  variable: "--font-knewave",
  subsets: ["latin"],
  weight: ["400"],
});

// Body font (closest to SF Pro Rounded)
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "pipeband.fun | Your Modern Pipe Band Trivia",
  description: "A fast-paced quiz that puts your pipe band knowledge to the test. Relive the golden years of pipe band medleys!",
  keywords: ["pipe band", "trivia", "quiz", "bagpipes", "Scotland", "music"],
  openGraph: {
    title: "pipeband.fun | Your Modern Pipe Band Trivia",
    description: "A fast-paced quiz that puts your pipe band knowledge to the test.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${knewave.variable} ${nunito.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
