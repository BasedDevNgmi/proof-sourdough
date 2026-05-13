"use client";

import { type CSSProperties, useState } from "react";
import Link from "next/link";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";
import { Pill } from "@/components/ui/pill";

interface BakeRowRecipe {
  id: string;
  title: string;
  totalTime: string;
  hydration?: string;
  difficulty: string;
}

interface BakeRowProps {
  recipe: BakeRowRecipe;
  href: string;
}

function difficultyTone(d: string): "beginner" | "intermediate" | "advanced" | "default" {
  const lower = d.toLowerCase();
  if (lower === "beginner") return "beginner";
  if (lower === "intermediate") return "intermediate";
  if (lower === "advanced") return "advanced";
  return "default";
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={12}
      height={12}
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

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
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function BakeRow({ recipe, href }: BakeRowProps) {
  const [hovered, setHovered] = useState(false);

  const linkStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 14px 12px 12px",
    background: hovered ? "var(--surface-2)" : "var(--surface)",
    border: hovered ? "1px solid var(--crust)" : "1px solid var(--border)",
    borderRadius: "var(--radius)",
    transition: "all 0.2s var(--ease-out)",
    textDecoration: "none",
    color: "inherit",
    transform: hovered ? "translateX(4px)" : "translateX(0)",
  };

  const breadBoxStyle: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "var(--surface-3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.2s var(--ease-out)",
    transform: hovered ? "rotate(-8deg) scale(1.1)" : "rotate(0deg) scale(1)",
  };

  const arrowStyle: CSSProperties = {
    marginLeft: "auto",
    flexShrink: 0,
    color: "var(--ink-mute)",
    transition: "transform 0.2s var(--ease-out)",
    transform: hovered ? "translateX(4px)" : "translateX(0)",
  };

  return (
    <Link
      href={href}
      style={linkStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="row-bread" style={breadBoxStyle}>
        <BreadIllustration seed={recipe.id} size={36} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{recipe.title}</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
            fontSize: 12,
            color: "var(--ink-mute)",
          }}
        >
          <ClockIcon />
          <span>{recipe.totalTime}</span>
          <Pill tone={difficultyTone(recipe.difficulty)}>
            {recipe.difficulty}
          </Pill>
        </div>
      </div>
      <div className="row-arrow" style={arrowStyle}>
        <ArrowIcon />
      </div>
    </Link>
  );
}

export default BakeRow;
