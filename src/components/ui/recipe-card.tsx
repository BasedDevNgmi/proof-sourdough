"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Droplets, Gauge, ArrowUpRight, BookOpen } from "lucide-react";
import type { Recipe } from "@/data/recipes";
import { books } from "@/data/recipes";

const difficultyColor = {
  beginner: "var(--color-emerald)",
  intermediate: "var(--color-amber)",
  advanced: "var(--color-rose)",
};

const difficultyStyles = {
  beginner: { color: "#34d399", background: "rgba(16, 185, 129, 0.1)" },
  intermediate: { color: "#fbbf24", background: "rgba(245, 158, 11, 0.1)" },
  advanced: { color: "#fb7185", background: "rgba(244, 63, 94, 0.1)" },
};

const categoryEmoji: Record<string, string> = {
  "free-form-loaves": "\u{1F35E}",
  "pan-loaves": "\u{1F35E}",
  "pizzas-flatbreads": "\u{1F355}",
  "buns-rolls-more": "\u{1F950}",
  sweets: "\u{1F9C1}",
  tutorial: "\u{1F4D6}",
};

export function RecipeCard({
  recipe,
  index = 0,
}: {
  recipe: Recipe;
  index?: number;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = Math.max(-3, Math.min(3, (x / rect.width) * 6));
    const rotateX = Math.max(-3, Math.min(3, -(y / rect.height) * 6));
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    el.style.transition = "transform 0.1s ease-out";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    el.style.transition = "transform 0.4s ease-out";
  }, []);

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
        ref={cardRef}
        href={`/recipes/${recipe.id}`}
        className="group block rounded-2xl overflow-hidden transition-all duration-300 card-glow"
        style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {recipe.image && (
          <div className="relative h-36 overflow-hidden">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--card) 0%, transparent 50%)" }} />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start gap-3.5">
            {!recipe.image && (
              <div
                className="text-2xl mt-0.5 w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-colors"
                style={{ background: "var(--accent-surface)" }}
              >
                {categoryEmoji[recipe.category] || "\u{1F35E}"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium truncate transition-colors" style={{ color: "var(--text)" }}>
                  {recipe.title}
                </h3>
                <ArrowUpRight size={14} className="shrink-0 mt-1 transition-colors" style={{ color: "var(--text-ghost)" }} />
              </div>
              {recipe.subtitle && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{recipe.subtitle}</p>
              )}
              <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {recipe.description}
              </p>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
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
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                  style={difficultyStyles[recipe.difficulty]}
                >
                  <Gauge size={12} />
                  {recipe.difficulty}
                </span>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-faint)" }}>
                  <BookOpen size={10} />
                  {(() => {
                    const book = books.find(b => b.id === recipe.bookId);
                    return book ? `${book.author}` : "";
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
