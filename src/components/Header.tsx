"use client";

import Logo from "./Logo";

interface HeaderProps {
  showLogin?: boolean;
  logoVariant?: "default" | "light";
}

export default function Header({ showLogin = false, logoVariant = "default" }: HeaderProps) {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center">
        <Logo size="md" variant={logoVariant} />
      </div>
    </header>
  );
}
