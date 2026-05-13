"use client";

import { useMemo } from "react";

interface SprinklesProps {
  active: boolean;
}

const COLORS = [
  "var(--crust)",
  "var(--jam)",
  "var(--leaf)",
  "var(--butter)",
  "var(--plum)",
  "var(--blue)",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function Sprinkles({ active }: SprinklesProps) {
  const pieces = useMemo(() => {
    const rng = seededRandom(42);
    return Array.from({ length: 60 }).map((_, i) => ({
      left: rng() * 100,
      delay: rng() * 3,
      duration: 2 + rng() * 3,
      color: COLORS[i % COLORS.length],
      width: 4 + rng() * 6,
      height: 8 + rng() * 12,
      rotation: rng() * 360,
    }));
  }, []);

  if (!active) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 999,
      pointerEvents: "none",
      overflow: "hidden",
    }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: -20,
            width: p.width,
            height: p.height,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotation}deg)`,
            animation: `drop ${p.duration}s ${p.delay}s ease-in forwards`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}
