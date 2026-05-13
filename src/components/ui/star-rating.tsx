"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  const [celebrate, setCelebrate] = useState(false);

  function handleClick(star: number) {
    navigator.vibrate?.(10);
    onChange?.(star);
    if (star === 5) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 600);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs text-stone-500 font-medium">{label}</span>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star, i) => (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && handleClick(star)}
            whileTap={readonly ? undefined : { scale: 1.3 }}
            animate={
              celebrate
                ? { scale: [1, 1.25, 1], transition: { delay: i * 0.05, type: "spring", stiffness: 500, damping: 15 } }
                : { scale: 1 }
            }
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className={`transition-colors duration-150 ${
              readonly ? "cursor-default" : "cursor-pointer"
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
          </motion.button>
        ))}
      </div>
    </div>
  );
}
