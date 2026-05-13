"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";
import type { Recipe } from "@/data/recipes";
import { books } from "@/data/recipes";

export function RecipeCard({
  recipe,
  index = 0,
}: {
  recipe: Recipe;
  index?: number;
}) {
  const book = books.find((b) => b.id === recipe.bookId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.03, 0.25),
      }}
      layout
    >
      <Link
        href={`/recipes/${recipe.id}`}
        className="group block overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          transition: "border-color 0.3s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        {recipe.image ? (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div style={{
            height: 180,
            background: "var(--surface-2)",
            display: "grid",
            placeItems: "center",
          }}>
            <BreadIllustration seed={recipe.id} size={120} />
          </div>
        )}
        <div style={{ padding: 20 }}>
          <div className="display" style={{ fontSize: 20, lineHeight: 1.2, marginBottom: 6 }}>
            {recipe.title}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5, marginBottom: 16 }}>
            {recipe.description}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 11,
            color: "var(--ink-faint)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em",
          }}>
            <span>{recipe.totalTime}</span>
            {recipe.hydration && (
              <>
                <span style={{ opacity: 0.4 }}>&middot;</span>
                <span>{recipe.hydration}</span>
              </>
            )}
            <span style={{ opacity: 0.4 }}>&middot;</span>
            <span>{recipe.difficulty}</span>
            {book && (
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-body)", fontSize: 12 }}>
                {book.author.split(" ").pop()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
