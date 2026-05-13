"use client";

import { type CSSProperties, useState } from "react";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";

interface PickCardRecipe {
  id: string;
  title: string;
  totalTime: string;
  hydration?: string;
  difficulty: string;
}

interface PickCardProps {
  recipe: PickCardRecipe;
  onClick: () => void;
}

export function PickCard({ recipe, onClick }: PickCardProps) {
  const [hovered, setHovered] = useState(false);

  const buttonStyle: CSSProperties = {
    padding: 16,
    background: hovered ? "var(--surface-2)" : "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    transition: "all 0.3s ease",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={buttonStyle}
    >
      <BreadIllustration seed={recipe.id} size={64} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{recipe.title}</div>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            marginTop: 4,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em",
          }}
        >
          {recipe.totalTime}
          {recipe.hydration && ` · ${recipe.hydration}`}
          {` · ${recipe.difficulty}`}
        </div>
      </div>
    </button>
  );
}

export default PickCard;
