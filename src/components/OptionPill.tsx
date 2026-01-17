"use client";

interface OptionPillProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function OptionPill({ 
  label, 
  selected, 
  onClick, 
  disabled = false 
}: OptionPillProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`option-pill ${selected ? "selected" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {label}
    </button>
  );
}
