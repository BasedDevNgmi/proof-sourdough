"use client";

import { type CSSProperties, type ReactNode, useState } from "react";

type Accent = "crust" | "jam";

interface ActionTileProps {
  onClick: () => void;
  accent: Accent;
  title: string;
  desc: string;
  art?: ReactNode;
}

const accentMap: Record<
  Accent,
  { from: string; to: string; border: string }
> = {
  crust: {
    from: "rgba(232,155,60,0.18)",
    to: "rgba(232,155,60,0.04)",
    border: "var(--crust)",
  },
  jam: {
    from: "rgba(199,90,58,0.18)",
    to: "rgba(199,90,58,0.04)",
    border: "var(--jam-soft)",
  },
};

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

export function ActionTile({
  onClick,
  accent,
  title,
  desc,
  art,
}: ActionTileProps) {
  const [hovered, setHovered] = useState(false);
  const a = accentMap[accent];

  const buttonStyle: CSSProperties = {
    position: "relative",
    padding: 28,
    background: `linear-gradient(135deg, ${a.from}, ${a.to}), var(--surface)`,
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    cursor: "pointer",
    textAlign: "left",
    overflow: "hidden",
    minHeight: 200,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    transition: "all 0.25s var(--ease-out)",
    transform: hovered
      ? "translateY(-4px) rotate(-0.4deg)"
      : "translateY(0) rotate(0deg)",
    boxShadow: hovered ? "var(--shadow-lg)" : "none",
  };

  const arrowStyle: CSSProperties = {
    position: "absolute",
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "var(--surface-2)",
    border: `1px solid ${a.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: a.border,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={buttonStyle}
    >
      <div>
        <div className="display" style={{ fontSize: 34 }}>
          {title}
        </div>
        <div style={{ color: "var(--ink-mute)", fontSize: 13, marginTop: 6 }}>
          {desc}
        </div>
      </div>
      {art && <div>{art}</div>}
      <div style={arrowStyle}>
        <ArrowIcon />
      </div>
    </button>
  );
}

export default ActionTile;
