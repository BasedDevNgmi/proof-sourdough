"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/illustrations/icons";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";
import { Pill } from "@/components/ui/pill";
import type { Recipe } from "@/data/recipes";
import { books } from "@/data/recipes";

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

  const handleMouseEnter = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const ill = el.querySelector('.bread-img');
    if (ill) (ill as HTMLElement).style.transform = 'scale(1.08) rotate(-3deg)';
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    el.style.transition = "transform 0.4s ease-out";
    const ill = el.querySelector('.bread-img');
    if (ill) (ill as HTMLElement).style.transform = '';
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
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{
          height: 160,
          background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))',
          position: 'relative',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
        }}>
          {/* speckle pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at 30% 20%, var(--crust-soft) 1.5px, transparent 2px),
                         radial-gradient(circle at 70% 60%, var(--leaf-soft) 1px, transparent 1.5px),
                         radial-gradient(circle at 20% 80%, var(--jam-soft) 1px, transparent 1.5px)`,
            backgroundSize: '40px 40px',
            opacity: 0.25,
          }} />
          <div className="bread-img" style={{ transition: 'transform 0.4s var(--ease-bounce)' }}>
            <BreadIllustration seed={recipe.id} size={140} />
          </div>
          <span style={{
            position: 'absolute', top: 12, right: 12,
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(0,0,0,0.3)',
            color: 'var(--ink)',
            display: 'grid', placeItems: 'center',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Icon.arrowUR width={13} height={13} />
          </span>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>{recipe.title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.4 }}>{recipe.description}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--ink-mute)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon.clock width={11} height={11} />{recipe.totalTime}</span>
            <span>·</span>
            {recipe.hydration && <span>💧 {recipe.hydration}</span>}
            <Pill tone={recipe.difficulty === 'beginner' ? 'beginner' : recipe.difficulty === 'advanced' ? 'advanced' : 'intermediate'}>
              {recipe.difficulty}
            </Pill>
            {book && (
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon.book width={11} height={11} />{book.author.split(" ").pop()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
