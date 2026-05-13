"use client";

import React from "react";

export type BreadType = "boule" | "batard" | "baguette" | "roll" | "pan" | "twist" | "bagel" | "pizza";

const BREAD_TYPES: BreadType[] = ["boule", "batard", "baguette", "roll", "pan", "twist", "bagel", "pizza"];

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getBreadShape(seed: string): BreadType {
  const h = hashStr(seed);
  return BREAD_TYPES[h % BREAD_TYPES.length];
}

interface BreadIllustrationProps {
  seed: string;
  size?: number;
  hue?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function BreadIllustration({ seed, size = 100, hue, style, className }: BreadIllustrationProps) {
  const shape = getBreadShape(seed);
  const uid = `bread-${hashStr(seed)}`;
  const gradId = `${uid}-grad`;
  const hiId = `${uid}-hi`;

  const crustColor = hue || "var(--crust)";
  const crustSoft = hue ? `${hue}88` : "var(--crust-soft)";
  const crustDeep = hue ? `${hue}cc` : "var(--crust-deep)";

  function renderSpeckles() {
    const h = hashStr(seed);
    return (
      <>
        <circle cx={15 + (h % 60)} cy={45 + (h % 30)} r={1} fill={crustDeep} opacity={0.4} />
        <circle cx={35 + ((h * 7) % 40)} cy={50 + ((h * 3) % 20)} r={0.8} fill={crustDeep} opacity={0.35} />
        <circle cx={60 + ((h * 11) % 25)} cy={40 + ((h * 5) % 25)} r={0.9} fill={crustDeep} opacity={0.45} />
      </>
    );
  }

  function renderShape() {
    switch (shape) {
      case "boule":
        return (
          <>
            <ellipse cx={50} cy={58} rx={38} ry={32} fill={`url(#${gradId})`} stroke={crustDeep} strokeWidth={1.2} />
            <ellipse cx={50} cy={58} rx={38} ry={32} fill={`url(#${hiId})`} />
            <path d="M 30 45 Q 50 35 70 45" stroke={crustDeep} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.6} />
            <path d="M 35 55 Q 50 48 65 55" stroke={crustDeep} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.6} />
            {renderSpeckles()}
          </>
        );
      case "batard":
        return (
          <>
            <ellipse cx={50} cy={55} rx={42} ry={22} fill={`url(#${gradId})`} stroke={crustDeep} strokeWidth={1.2} />
            <ellipse cx={50} cy={55} rx={42} ry={22} fill={`url(#${hiId})`} />
            <path d="M 25 45 L 35 60" stroke={crustDeep} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.6} />
            <path d="M 42 43 L 52 58" stroke={crustDeep} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.6} />
            <path d="M 59 45 L 69 60" stroke={crustDeep} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.6} />
            {renderSpeckles()}
          </>
        );
      case "baguette":
        return (
          <>
            <rect x={8} y={42} width={84} height={22} rx={11} fill={`url(#${gradId})`} stroke={crustDeep} strokeWidth={1.2} />
            <rect x={8} y={42} width={84} height={22} rx={11} fill={`url(#${hiId})`} />
            {[20, 36, 52, 68].map((x) => (
              <path key={x} d={`M ${x} 44 L ${x + 8} 62`} stroke={crustDeep} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.6} />
            ))}
            {renderSpeckles()}
          </>
        );
      case "roll":
        return (
          <>
            <ellipse cx={30} cy={62} rx={22} ry={18} fill={`url(#${gradId})`} stroke={crustDeep} strokeWidth={1.2} />
            <ellipse cx={65} cy={58} rx={22} ry={18} fill={`url(#${gradId})`} stroke={crustDeep} strokeWidth={1.2} />
            <ellipse cx={48} cy={38} rx={20} ry={16} fill={`url(#${gradId})`} stroke={crustDeep} strokeWidth={1.2} />
            <ellipse cx={30} cy={62} rx={22} ry={18} fill={`url(#${hiId})`} />
            <ellipse cx={65} cy={58} rx={22} ry={18} fill={`url(#${hiId})`} />
            <ellipse cx={48} cy={38} rx={20} ry={16} fill={`url(#${hiId})`} />
            {renderSpeckles()}
          </>
        );
      case "pan":
        return (
          <>
            <path d="M 18 70 L 18 50 Q 18 25 50 25 Q 82 25 82 50 L 82 70 Z" fill={`url(#${gradId})`} stroke={crustDeep} strokeWidth={1.2} />
            <path d="M 18 70 L 18 50 Q 18 25 50 25 Q 82 25 82 50 L 82 70 Z" fill={`url(#${hiId})`} />
            <line x1={18} y1={50} x2={82} y2={50} stroke={crustDeep} strokeWidth={1} opacity={0.5} />
            {renderSpeckles()}
          </>
        );
      case "twist":
        return (
          <>
            <path
              d="M 10 55 Q 20 40 30 55 Q 40 70 50 55 Q 60 40 70 55 Q 80 70 90 55"
              stroke={`url(#${gradId})`}
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 10 50 Q 20 65 30 50 Q 40 35 50 50 Q 60 65 70 50 Q 80 35 90 50"
              stroke={`url(#${gradId})`}
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 10 55 Q 20 40 30 55 Q 40 70 50 55 Q 60 40 70 55 Q 80 70 90 55"
              stroke={crustDeep}
              strokeWidth={1}
              strokeLinecap="round"
              fill="none"
              opacity={0.4}
            />
            <path
              d="M 10 50 Q 20 65 30 50 Q 40 35 50 50 Q 60 65 70 50 Q 80 35 90 50"
              stroke={crustDeep}
              strokeWidth={1}
              strokeLinecap="round"
              fill="none"
              opacity={0.4}
            />
            {renderSpeckles()}
          </>
        );
      case "bagel":
        return (
          <>
            <ellipse cx={50} cy={50} rx={36} ry={32} fill={`url(#${gradId})`} stroke={crustDeep} strokeWidth={1.2} />
            <ellipse cx={50} cy={50} rx={36} ry={32} fill={`url(#${hiId})`} />
            <ellipse cx={50} cy={52} rx={12} ry={9} fill="var(--bg)" stroke={crustDeep} strokeWidth={1} />
            <circle cx={35} cy={38} r={1.5} fill={crustDeep} opacity={0.5} />
            <circle cx={58} cy={36} r={1.2} fill={crustDeep} opacity={0.5} />
            <circle cx={68} cy={50} r={1.4} fill={crustDeep} opacity={0.5} />
            <circle cx={40} cy={65} r={1.3} fill={crustDeep} opacity={0.5} />
            <circle cx={62} cy={64} r={1.1} fill={crustDeep} opacity={0.5} />
            <circle cx={30} cy={52} r={1.3} fill={crustDeep} opacity={0.5} />
            {renderSpeckles()}
          </>
        );
      case "pizza":
        return (
          <>
            <rect x={12} y={45} width={76} height={32} rx={4} fill={`url(#${gradId})`} stroke={crustDeep} strokeWidth={1.2} />
            <rect x={12} y={45} width={76} height={32} rx={4} fill={`url(#${hiId})`} />
            <rect x={16} y={48} width={68} height={22} rx={2} fill="var(--jam-soft)" opacity={0.7} />
            <circle cx={30} cy={58} r={4} fill="var(--leaf)" opacity={0.7} />
            <circle cx={50} cy={55} r={3.5} fill="var(--butter)" opacity={0.7} />
            <circle cx={68} cy={60} r={4} fill="var(--leaf)" opacity={0.7} />
            <circle cx={42} cy={64} r={3} fill="var(--butter)" opacity={0.7} />
            <circle cx={60} cy={52} r={3.5} fill="var(--leaf)" opacity={0.7} />
            {renderSpeckles()}
          </>
        );
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      style={style}
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={crustSoft} />
          <stop offset="60%" stopColor={crustColor} />
          <stop offset="100%" stopColor={crustDeep} />
        </linearGradient>
        <radialGradient id={hiId} cx="0.35" cy="0.3" r="0.5">
          <stop offset="0%" stopColor="rgba(255,230,170,0.45)" />
          <stop offset="100%" stopColor="rgba(255,230,170,0)" />
        </radialGradient>
      </defs>
      {renderShape()}
    </svg>
  );
}
