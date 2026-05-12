"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Droplets, Gauge } from "lucide-react";
import type { Recipe } from "@/data/recipes";

const difficultyColor = {
  beginner: "text-emerald-400",
  intermediate: "text-amber-400",
  advanced: "text-rose-400",
};

const categoryEmoji: Record<string, string> = {
  "free-form-loaves": "🍞",
  "pan-loaves": "🍞",
  "pizzas-flatbreads": "🍕",
  "buns-rolls-more": "🥐",
  sweets: "🧁",
  tutorial: "📖",
};

export function RecipeCard({
  recipe,
  index = 0,
}: {
  recipe: Recipe;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Link
        href={`/recipes/${recipe.id}`}
        className="block bg-stone-900 rounded-2xl p-4 active:bg-stone-800 transition-colors duration-150 border border-stone-800/50"
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl mt-0.5">
            {categoryEmoji[recipe.category] || "🍞"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-stone-100 truncate">
              {recipe.title}
            </h3>
            {recipe.subtitle && (
              <p className="text-xs text-stone-500 mt-0.5">{recipe.subtitle}</p>
            )}
            <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
              {recipe.description}
            </p>
            <div className="flex items-center gap-3 mt-3 text-[11px] text-stone-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {recipe.totalTime}
              </span>
              {recipe.hydration && (
                <span className="flex items-center gap-1">
                  <Droplets size={12} />
                  {recipe.hydration}
                </span>
              )}
              <span
                className={`flex items-center gap-1 ${difficultyColor[recipe.difficulty]}`}
              >
                <Gauge size={12} />
                {recipe.difficulty}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
