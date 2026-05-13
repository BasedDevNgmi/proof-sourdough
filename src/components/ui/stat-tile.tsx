"use client";

import { type CSSProperties, type ReactNode, useState } from "react";

type Tone = "crust" | "leaf" | "plum" | "butter";

interface StatTileProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  tone: Tone;
  subtext: string;
}

const toneMap: Record<Tone, { bg: string; color: string; border: string }> = {
  crust: {
    bg: "rgba(232,155,60,0.10)",
    color: "var(--crust)",
    border: "rgba(232,155,60,0.3)",
  },
  leaf: {
    bg: "rgba(107,148,98,0.10)",
    color: "var(--leaf)",
    border: "rgba(107,148,98,0.3)",
  },
  plum: {
    bg: "rgba(139,90,143,0.12)",
    color: "var(--plum)",
    border: "rgba(139,90,143,0.3)",
  },
  butter: {
    bg: "rgba(247,216,137,0.10)",
    color: "var(--butter)",
    border: "rgba(247,216,137,0.35)",
  },
};

export function StatTile({ icon, value, label, tone, subtext }: StatTileProps) {
  const [hovered, setHovered] = useState(false);
  const t = toneMap[tone];

  const outerStyle: CSSProperties = {
    padding: 18,
    background: "var(--surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    transition: "all 0.25s var(--ease-out)",
    transform: hovered ? "translateY(-3px)" : "translateY(0)",
    boxShadow: hovered ? "var(--shadow-md)" : "none",
  };

  const badgeStyle: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: t.bg,
    border: `1px solid ${t.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: t.color,
  };

  return (
    <div
      className="stat-tile"
      style={outerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={badgeStyle}>{icon}</div>
      <div className="display stat-tile-value" style={{ fontSize: 40 }}>
        {value}
      </div>
      <div className="label">{label}</div>
      <div className="script" style={{ fontSize: 14, color: "var(--ink-mute)" }}>
        {subtext}
      </div>
    </div>
  );
}

export default StatTile;
