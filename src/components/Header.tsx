"use client";

import Logo from "./Logo";

interface HeaderProps {
  showLogin?: boolean;
}

export default function Header({ showLogin = false }: HeaderProps) {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-center">
        <Logo size="md" />
      </div>
    </header>
  );
}
