"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-6 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-8">
        <Link 
          href="/about" 
          className="text-small hover:text-accent transition-colors"
        >
          About
        </Link>
        <Link 
          href="/leaderboard" 
          className="text-small hover:text-accent transition-colors"
        >
          Leaderboard
        </Link>
      </div>
    </footer>
  );
}
