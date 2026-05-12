"use client";

import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  size = 24,
  readonly = false,
  label,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs text-stone-500 font-medium">{label}</span>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={`transition-all duration-150 ${
              readonly ? "cursor-default" : "cursor-pointer active:scale-110"
            }`}
          >
            <Star
              size={size}
              className={
                value && star <= value
                  ? "fill-amber-500 text-amber-500"
                  : "text-stone-700"
              }
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
