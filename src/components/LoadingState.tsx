"use client";

import Header from "./Header";
import Footer from "./Footer";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export default function LoadingState({
  message,
  fullScreen = true,
  showHeader = true,
  showFooter = false,
  className = "",
}: LoadingStateProps) {
  const content = (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto mb-4"></div>
        {message && <p className="text-body">{message}</p>}
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className={className}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto mb-4"></div>
          {message && <p className="text-body">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {showHeader && <Header />}
      {content}
      {showFooter && <Footer />}
    </div>
  );
}
