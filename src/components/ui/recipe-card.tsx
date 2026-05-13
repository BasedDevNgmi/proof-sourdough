"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Droplets, BookOpen } from "lucide-react";
import type { Recipe } from "@/data/recipes";
import { books } from "@/data/recipes";

const difficultyStyles = {
  beginner: { color: "#34d399", background: "rgba(16, 185, 129, 0.85)" },
  intermediate: { color: "#fbbf24", background: "rgba(245, 158, 11, 0.85)" },
  advanced: { color: "#fb7185", background: "rgba(244, 63, 94, 0.85)" },
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

  const book = books.find((b) => b.id === recipe.bookId);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.03, 0.25),
        ease: [0.25, 0.1, 0.25, 1],
      }}
      layout
    >
      <Link
        ref={cardRef}
        href={`/recipes/${recipe.id}`}
        className="group block rounded-2xl overflow-hidden transition-all duration-300"
        style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {recipe.image ? (
          <div className="relative h-44 overflow-hidden">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span
              className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm"
              style={{
                background: difficultyStyles[recipe.difficulty].background,
                color: "#fff",
              }}
            >
              {recipe.difficulty}
            </span>
          </div>
        ) : (
          <div
            className="relative h-28 flex items-center justify-center"
            style={{ background: "var(--accent-surface)" }}
          >
            <span className="text-4xl">🍞</span>
            <span
              className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: difficultyStyles[recipe.difficulty].background,
                color: "#fff",
              }}
            >
              {recipe.difficulty}
            </span>
          </div>
        )}
        <div className="px-4 pt-3 pb-3.5">
          <h3
            className="font-medium text-[15px] leading-snug truncate group-hover:text-[var(--accent)] transition-colors duration-200"
            style={{ color: "var(--text)" }}
          >
            {recipe.title}
          </h3>
          {recipe.subtitle && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
              {recipe.subtitle}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {recipe.totalTime}
            </span>
            {recipe.hydration && (
              <span className="flex items-center gap-1">
                <Droplets size={11} />
                {recipe.hydration}
              </span>
            )}
            {book && (
              <span className="flex items-center gap-1 ml-auto text-[10px]" style={{ color: "var(--text-faint)" }}>
                <BookOpen size={10} />
                {book.author.split(" ").pop()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
