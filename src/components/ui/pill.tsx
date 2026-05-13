"use client";

import { type CSSProperties, type ReactNode } from "react";

interface PillProps {
  tone?: string;
  children: ReactNode;
  style?: CSSProperties;
}

export function Pill({ children, style }: PillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--ink-mute)",
        border: "1px solid var(--border)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export default Pill;
