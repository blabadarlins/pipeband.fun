"use client";

import { useState, useEffect } from "react";
import Button from "./Button";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageBlob: Blob | null;
  isLoading: boolean;
}

function CloseIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function ShareModal({ isOpen, onClose, imageBlob, isLoading }: ShareModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Create data URL for image preview (more reliable than blob URL)
  useEffect(() => {
    if (imageBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.onerror = () => {
        console.error("Failed to read image blob");
        setImageUrl(null);
      };
      reader.readAsDataURL(imageBlob);
    } else {
      setImageUrl(null);
    }
  }, [imageBlob]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setCopyError(null);
      setImageUrl(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    if (!imageBlob) return;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ [imageBlob.type]: imageBlob })
      ]);
      setCopied(true);
      setCopyError(null);
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy image:", err);
      setCopyError("Unable to copy. Try downloading instead.");
    }
  };

  const handleDownload = () => {
    if (!imageBlob) return;

    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pipeband-results.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-blue/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-grey hover:text-blue transition-colors z-10"
        >
          <CloseIcon />
        </button>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-blue mb-4 pr-8">Share Your Score</h2>

          {/* Image preview */}
          <div className="mb-6 rounded-xl overflow-hidden shadow-lg bg-grey-2">
            {isLoading ? (
              <div className="aspect-square flex items-center justify-center">
                <div className="animate-pulse text-grey">Generating image...</div>
              </div>
            ) : imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Your pipeband.fun score" 
                className="w-full aspect-square object-contain"
                onError={(e) => {
                  console.error("Image failed to load:", imageUrl);
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="aspect-square flex items-center justify-center">
                <span className="text-grey">Failed to generate image</span>
              </div>
            )}
          </div>

          {/* Error message */}
          {copyError && (
            <p className="text-red-500 text-sm mb-4 text-center">{copyError}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              icon={copied ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopy}
              disabled={isLoading || !imageBlob}
              className="flex-1"
            >
              {copied ? "Copied!" : "Copy Image"}
            </Button>
            <Button
              variant="secondary"
              icon={<DownloadIcon />}
              onClick={handleDownload}
              disabled={isLoading || !imageBlob}
              className="flex-1"
            >
              Download
            </Button>
          </div>

          {/* Help text */}
          <p className="text-sm text-grey text-center mt-4">
            Copy the image and paste it directly into Facebook, or download to share later.
          </p>
        </div>
      </div>
    </div>
  );
}
