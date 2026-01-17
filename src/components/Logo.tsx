"use client";

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
  className?: string;
}

const sizes = {
  sm: {
    pipeband: "text-[28px]",
    fun: "text-[26px]",
  },
  md: {
    pipeband: "text-[47px]",
    fun: "text-[43px]",
  },
  lg: {
    pipeband: "text-[60px]",
    fun: "text-[55px]",
  },
};

export default function Logo({ size = "md", variant = "default", className = "" }: LogoProps) {
  const sizeStyles = sizes[size];
  const funColorClass = variant === "light" ? "logo-fun-light" : "";

  return (
    <Link href="/" className={`inline-flex items-baseline ${className}`}>
      <span className={`logo-pipeband ${sizeStyles.pipeband}`}>pipeband</span>
      <span className={`logo-fun ${sizeStyles.fun} ${funColorClass}`}>.fun</span>
    </Link>
  );
}
