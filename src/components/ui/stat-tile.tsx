"use client";

import { type CSSProperties, type ReactNode, useState } from "react";

type Tone = "crust" | "leaf" | "plum" | "butter";

interface StatTileProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  tone: Tone;
}

const toneMap: Record<Tone, { bg: string; color: string; border: string }> = {
  crust: {
    bg: "var(--accent-surface)",
    color: "var(--crust)",
    border: "var(--border)",
  },
  leaf: {
    bg: "var(--accent-surface)",
    color: "var(--leaf)",
    border: "var(--border)",
  },
  plum: {
    bg: "var(--accent-surface)",
    color: "var(--plum)",
    border: "var(--border)",
  },
  butter: {
    bg: "var(--accent-surface)",
    color: "var(--butter)",
    border: "var(--border)",
  },
};

export function StatTile({ icon, value, label, tone }: StatTileProps) {
  const [hovered, setHovered] = useState(false);
  const t = toneMap[tone];

  const outerStyle: CSSProperties = {
    padding: 20,
    background: "var(--surface)",
    borderRadius: "var(--radius-lg)",
    border: hovered ? "1px solid var(--border-strong)" : "1px solid var(--border)",
    transition: "border-color 0.3s ease",
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
    </div>
  );
}

export default StatTile;
