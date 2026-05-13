"use client";

import { type CSSProperties, useState } from "react";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";
import { Pill } from "@/components/ui/pill";

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

function difficultyTone(d: string): "beginner" | "intermediate" | "advanced" | "default" {
  const lower = d.toLowerCase();
  if (lower === "beginner") return "beginner";
  if (lower === "intermediate") return "intermediate";
  if (lower === "advanced") return "advanced";
  return "default";
}

export function PickCard({ recipe, onClick }: PickCardProps) {
  const [hovered, setHovered] = useState(false);

  const buttonStyle: CSSProperties = {
    padding: 16,
    background: "var(--surface)",
    border: hovered ? "1px solid var(--border-strong)" : "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    transition: "all 0.25s var(--ease-out)",
    transform: hovered ? "translateY(-2px)" : "translateY(0)",
    boxShadow: hovered ? "var(--shadow-md)" : "none",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={buttonStyle}
    >
      <BreadIllustration seed={recipe.id} size={72} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{recipe.title}</div>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            marginTop: 4,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span>{recipe.totalTime}</span>
          {recipe.hydration && <span>{recipe.hydration}</span>}
        </div>
        <div style={{ marginTop: 6 }}>
          <Pill tone={difficultyTone(recipe.difficulty)}>
            {recipe.difficulty}
          </Pill>
        </div>
      </div>
    </button>
  );
}

export default PickCard;
