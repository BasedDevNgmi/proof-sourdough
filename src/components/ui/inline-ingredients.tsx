"use client";

import { type Ingredient } from "@/data/recipes";

interface InlineIngredientsProps {
  text: string;
  ingredients: Ingredient[];
  multiplier: number;
}

function scaleAmount(amount: string, multiplier: number): string {
  if (multiplier === 1) return amount;
  const match = amount.match(/^(\d+(?:\.\d+)?)\s*(g|ml|oz)?$/i);
  if (!match) return amount;
  const scaled = Math.round(parseFloat(match[1]) * multiplier);
  return `${scaled}${match[2] || ""}`;
}

export function InlineIngredients({ text, ingredients, multiplier }: InlineIngredientsProps) {
  const amounts = ingredients
    .filter((ing) => ing.weight)
    .map((ing) => ({
      name: ing.name.toLowerCase().replace(/\([^)]*\)/g, "").trim(),
      weight: ing.weight,
    }));

  if (amounts.length === 0) return <>{text}</>;

  const amountPattern = /(\d+(?:\.\d+)?)\s*(g|ml|oz)\b/gi;
  const parts: { text: string; isAmount: boolean; scaled?: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = amountPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isAmount: false });
    }
    const original = match[0];
    const scaled = scaleAmount(original, multiplier);
    parts.push({ text: original, isAmount: true, scaled });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isAmount: false });
  }

  if (parts.every((p) => !p.isAmount)) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) =>
        part.isAmount ? (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85em",
              background: "var(--accent-surface)",
              padding: "1px 4px",
              borderRadius: 4,
              color: "var(--crust)",
              fontVariantNumeric: "tabular-nums",
            }}
            title={multiplier !== 1 ? `Original: ${part.text}` : undefined}
          >
            {part.scaled}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}
