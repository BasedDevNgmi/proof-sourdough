"use client";

import { type CSSProperties, type ReactNode } from "react";

type Tone = "default" | "beginner" | "intermediate" | "advanced";

interface PillProps {
  tone?: Tone;
  children: ReactNode;
  style?: CSSProperties;
}

const toneStyles: Record<Tone, CSSProperties> = {
  default: {
    background: "var(--surface-2)",
    color: "var(--ink-soft)",
    border: "1px solid var(--border)",
  },
  beginner: {
    background: "rgba(107,148,98,0.15)",
    color: "var(--leaf-soft)",
    border: "1px solid rgba(107,148,98,0.4)",
  },
  intermediate: {
    background: "rgba(232,155,60,0.12)",
    color: "var(--crust)",
    border: "1px solid rgba(232,155,60,0.4)",
  },
  advanced: {
    background: "rgba(199,90,58,0.15)",
    color: "var(--jam-soft)",
    border: "1px solid rgba(199,90,58,0.4)",
  },
};

export function Pill({ tone = "default", children, style }: PillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
        ...toneStyles[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export default Pill;
