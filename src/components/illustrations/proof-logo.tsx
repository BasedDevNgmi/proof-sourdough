"use client";

interface ProofLogoProps {
  size?: number;
  animated?: boolean;
}

export function ProofLogo({ size = 38, animated = true }: ProofLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="loafGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--crust-soft)" />
          <stop offset="60%" stopColor="var(--crust)" />
          <stop offset="100%" stopColor="var(--crust-deep)" />
        </linearGradient>
        <radialGradient id="loafHi" cx="0.35" cy="0.3" r="0.4">
          <stop offset="0%" stopColor="rgba(255,230,170,0.55)" />
          <stop offset="100%" stopColor="rgba(255,230,170,0)" />
        </radialGradient>
      </defs>
      <g className={animated ? "anim-breathe" : ""} style={{ transformOrigin: "32px 38px" }}>
        <path
          d="M 14 56 L 14 20 Q 14 8 28 8 L 38 8 Q 52 8 52 22 Q 52 36 38 36 L 26 36 L 26 56 Z"
          fill="url(#loafGrad)"
          stroke="var(--crust-deep)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M 14 56 L 14 20 Q 14 8 28 8 L 38 8 Q 52 8 52 22 Q 52 36 38 36 L 26 36 L 26 56 Z"
          fill="url(#loafHi)"
        />
        <path d="M 20 14 Q 26 12 32 14" stroke="var(--crust-deep)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M 32 26 Q 38 24 44 26" stroke="var(--crust-deep)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
        <circle cx="22" cy="28" r="1" fill="var(--crust-deep)" opacity="0.5" />
        <circle cx="42" cy="18" r="0.8" fill="var(--crust-deep)" opacity="0.5" />
        <circle cx="36" cy="50" r="0.9" fill="var(--crust-deep)" opacity="0.5" />
      </g>
      {animated && (
        <g opacity="0.7">
          <circle cx="32" cy="6" r="1.5" fill="var(--ink-mute)">
            <animate attributeName="cy" values="6;-4;-12" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.5;0" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="40" cy="4" r="1.2" fill="var(--ink-mute)">
            <animate attributeName="cy" values="4;-6;-14" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.4;0" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
}
