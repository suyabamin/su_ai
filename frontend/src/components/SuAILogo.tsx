import React from 'react';

interface SuAILogoProps {
  className?: string;
  size?: number;
}

export const SuAILogo: React.FC<SuAILogoProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`}
      aria-label="SuAI Logo"
    >
      {/* Refined Minimalist Geometric Intelligence Glyph */}
      <defs>
        <linearGradient id="suai-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* Outer Hexagonal Ring */}
      <path
        d="M16 3L27.2583 9.5V22.5L16 29L4.74167 22.5V9.5L16 3Z"
        stroke="url(#suai-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Dynamic Core Node */}
      <path
        d="M16 10L21.1962 13V19L16 22L10.8038 19V13L16 10Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Center Micro Spark */}
      <circle cx="16" cy="16" r="1.75" fill="currentColor" />
    </svg>
  );
};
