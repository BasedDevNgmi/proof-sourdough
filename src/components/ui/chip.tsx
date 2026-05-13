"use client";

import { type ReactNode, useState } from "react";

interface ChipProps {
  active: boolean;
  small?: boolean;
  children: ReactNode;
  onClick: () => void;
}

export function Chip({ active, small, children, onClick }: ChipProps) {
  const [hovered, setHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: small ? "7px 14px" : "8px 16px",
    borderRadius: 999,
    fontSize: small ? 12 : 13,
    cursor: "pointer",
    transition: "all 0.2s var(--ease-out)",
    outline: "none",
  };

  const activeStyle: React.CSSProperties = active
    ? {
        background: "var(--crust)",
        border: "1px solid var(--crust)",
        color: "var(--bg)",
        fontWeight: 600,
      }
    : {
        background: hovered ? "var(--surface-2)" : "var(--surface)",
        border: hovered
          ? "1px solid var(--border-strong)"
          : "1px solid var(--border)",
        color: "var(--ink-soft)",
        fontWeight: 500,
      };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...baseStyle, ...activeStyle }}
    >
      {children}
    </button>
  );
}

export default Chip;
