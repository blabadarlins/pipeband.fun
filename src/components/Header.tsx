"use client";

import { useState, useRef, useEffect } from "react";
import Logo from "./Logo";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";

interface HeaderProps {
  showLogin?: boolean;
  logoVariant?: "default" | "light";
}

export default function Header({ showLogin = false, logoVariant = "default" }: HeaderProps) {
  const { user, isAuthenticated, isLoading, logout } = useSpotifyAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const profileImageUrl = user?.images?.[0]?.url;
  const displayInitial = user?.display_name?.charAt(0)?.toUpperCase() || "?";

  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Logo size="md" variant={logoVariant} />
        
        {/* Spacer to keep logo centered when no profile */}
        {!isAuthenticated && !isLoading && <div className="w-10" />}
        
        {/* Profile menu */}
        {isAuthenticated && !isLoading && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-accent transition-colors focus:outline-none focus:border-accent"
              aria-label="Profile menu"
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={user?.display_name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent flex items-center justify-center text-white font-bold">
                  {displayInitial}
                </div>
              )}
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-grey-2 py-2 z-50">
                <div className="px-4 py-2 border-b border-grey-2">
                  <p className="font-bold text-blue truncate">{user?.display_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-grey hover:bg-grey-2 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Loading placeholder */}
        {isLoading && <div className="w-10 h-10" />}
      </div>
    </header>
  );
}
