"use client";

interface SteamProps {
  count?: number;
}

export function Steam({ count = 6 }: SteamProps) {
  return (
    <div style={{
      position: "absolute",
      bottom: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      width: 60,
      height: 50,
      pointerEvents: "none",
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{
          position: "absolute",
          left: `${20 + (i * 8) % 40}px`,
          bottom: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--ink-mute)",
          opacity: 0,
          animation: `steam 3s ${i * 0.4}s ease-out infinite`,
          ["--sx" as string]: `${(i % 2 ? 1 : -1) * (4 + i)}px`,
        }} />
      ))}
    </div>
  );
}
