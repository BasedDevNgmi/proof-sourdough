"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Droplets, Gauge, ArrowUpRight } from "lucide-react";
import type { Recipe } from "@/data/recipes";
import { books } from "@/data/recipes";

const difficultyColor = {
  beginner: "text-emerald-400",
  intermediate: "text-amber-400",
  advanced: "text-rose-400",
};

const difficultyBg = {
  beginner: "bg-emerald-500/10",
  intermediate: "bg-amber-500/10",
  advanced: "bg-rose-500/10",
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
        className="group block bg-stone-900 rounded-2xl p-4 active:bg-stone-800 transition-all duration-300 border border-stone-800/50 card-glow"
      >
        <div className="flex items-start gap-3.5">
          <div className="text-2xl mt-0.5 w-10 h-10 flex items-center justify-center rounded-xl bg-stone-800/50 group-hover:bg-stone-800 transition-colors shrink-0">
            {categoryEmoji[recipe.category] || "🍞"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-stone-100 truncate group-hover:text-amber-50 transition-colors">
                {recipe.title}
              </h3>
              <ArrowUpRight size={14} className="text-stone-700 group-hover:text-amber-500/50 transition-colors shrink-0 mt-1" />
            </div>
            {recipe.subtitle && (
              <p className="text-xs text-stone-500 mt-0.5">{recipe.subtitle}</p>
            )}
            <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
              {recipe.description}
            </p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px] text-stone-500">
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
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${difficultyColor[recipe.difficulty]} ${difficultyBg[recipe.difficulty]}`}
              >
                <Gauge size={12} />
                {recipe.difficulty}
              </span>
              <span className="text-stone-600 text-[10px]">
                {books.find(b => b.id === recipe.bookId)?.title}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
