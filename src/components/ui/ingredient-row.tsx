"use client";

import { Check } from "lucide-react";

interface IngredientRowProps {
  name: string;
  weight: string;
  percentage?: string;
  checked?: boolean;
  onToggle?: () => void;
  note?: string;
}

export function IngredientRow({
  name,
  weight,
  percentage,
  checked,
  onToggle,
  note,
}: IngredientRowProps) {
  const isCheckable = onToggle !== undefined;
  const Tag = isCheckable ? "button" : "div";

  return (
    <Tag
      type={isCheckable ? "button" : undefined}
      onClick={isCheckable ? onToggle : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        width: "100%",
        background: "transparent",
        border: "none",
        cursor: isCheckable ? "pointer" : "default",
        textAlign: "left",
        fontFamily: "inherit",
      }}
    >
      {/* Checkbox */}
      {isCheckable && (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: `1.5px solid ${checked ? "var(--crust)" : "var(--border-strong)"}`,
            background: checked ? "var(--crust)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {checked && <Check size={10} style={{ color: "var(--bg)" }} />}
        </div>
      )}

      {/* Name */}
      <span
        style={{
          fontSize: 14,
          fontFamily: "var(--font-body)",
          color: "var(--ink-soft)",
          textDecoration: checked ? "line-through" : "none",
          opacity: checked ? 0.5 : 1,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {name}
        {note && (
          <span
            style={{
              fontSize: 10,
              color: "var(--ink-faint)",
              marginLeft: 6,
            }}
          >
            {note}
          </span>
        )}
      </span>

      {/* Dot leader */}
      <span
        style={{
          flexGrow: 1,
          borderBottom: "1px dotted var(--border)",
          alignSelf: "center",
          minWidth: 16,
          marginBottom: 1,
          opacity: checked ? 0.3 : 0.6,
        }}
      />

      {/* Baker's percentage */}
      {percentage && (
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--ink-faint)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            opacity: checked ? 0.5 : 1,
          }}
        >
          {percentage}
        </span>
      )}

      {/* Weight */}
      <span
        style={{
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          color: "var(--ink-soft)",
          whiteSpace: "nowrap",
          flexShrink: 0,
          opacity: checked ? 0.5 : 1,
        }}
      >
        {weight}
      </span>
    </Tag>
  );
}
