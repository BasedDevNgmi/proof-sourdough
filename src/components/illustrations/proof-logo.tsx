"use client";

interface ProofLogoProps {
  size?: number;
}

export function ProofLogo({ size = 28 }: ProofLogoProps) {
  return (
    <span
      className="display"
      style={{
        fontSize: size,
        fontStyle: "italic",
        color: "var(--ink)",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      Proof
    </span>
  );
}
