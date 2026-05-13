"use client";

import { useMemo } from "react";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function FlourMotes() {
  const motes = useMemo(() => {
    const rng = seededRandom(7);
    return Array.from({ length: 14 }).map(() => ({
      left: rng() * 100,
      delay: rng() * 10,
      duration: 16 + rng() * 16,
      size: 3 + rng() * 5,
    }));
  }, []);

  return (
    <>
      {motes.map((m, i) => (
        <span
          key={i}
          className="flour-mote"
          style={{
            position: "fixed",
            left: `${m.left}%`,
            bottom: -10,
            width: m.size,
            height: m.size,
            borderRadius: "50%",
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
