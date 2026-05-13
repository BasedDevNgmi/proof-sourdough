"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChefHat, Clock, ArrowRight } from "lucide-react";
import { supabase, type BakeSession } from "@/lib/supabase";
import { recipes, getRecipeById } from "@/data/recipes";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function BakePage() {
  const [activeBakes, setActiveBakes] = useState<BakeSession[]>([]);

  useEffect(() => {
    supabase
      .from("bake_sessions")
      .select("*")
      .eq("status", "in-progress")
      .order("started_at", { ascending: false })
      .then(({ data }) => {
        if (data) setActiveBakes(data);
      });
  }, []);

  const categories = [
    { id: "tutorial", label: "Start Here", emoji: "\u{1F4D6}" },
    { id: "free-form-loaves", label: "Free-Form Loaves", emoji: "\u{1F35E}" },
    { id: "pan-loaves", label: "Pan Loaves", emoji: "\u{1F35E}" },
    { id: "pizzas-flatbreads", label: "Pizza & Flatbreads", emoji: "\u{1F355}" },
    { id: "buns-rolls-more", label: "Rolls & More", emoji: "\u{1F950}" },
    { id: "sweets", label: "Sweets", emoji: "\u{1F9C1}" },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Start a Bake" subtitle="Pick your adventure" />

        {/* Active Bakes */}
        {activeBakes.length > 0 && (
          <div className="px-5 mb-6">
            <h2 className="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
              <div className="w-2 h-2 rounded-full animate-gentle-pulse" style={{ background: "var(--accent)" }} />
              In Progress
            </h2>
            <div className="space-y-2 max-w-xl">
              {activeBakes.map((bake) => {
                const recipe = getRecipeById(bake.recipe_id);
                return (
                  <Link
                    key={bake.id}
                    href={`/bake/${bake.recipe_id}?session=${bake.id}`}
                    className="flex items-center justify-between rounded-xl p-3.5 transition-colors"
                    style={{ background: "var(--accent-surface)", border: "1px solid var(--accent-surface)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {recipe?.title || bake.recipe_id}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Started{" "}
                        {formatDistanceToNow(new Date(bake.started_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--accent)" }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recipe Categories */}
        <div className="px-5 pb-8">
          {categories.map((cat, catIdx) => {
            const catRecipes = recipes.filter((r) => r.category === cat.id);
            if (catRecipes.length === 0) return null;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.08 }}
                className="mb-8"
              >
                <h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <span>{cat.emoji}</span>
                  {cat.label}
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                    ({catRecipes.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {catRecipes.map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/bake/${recipe.id}`}
                      className="flex items-center justify-between rounded-xl p-3 transition-all duration-200 card-glow"
                      style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: "var(--text)" }}>
                          {recipe.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                            <Clock size={10} /> {recipe.totalTime}
                          </span>
                          <Badge
                            variant={
                              recipe.difficulty === "beginner"
                                ? "emerald"
                                : recipe.difficulty === "intermediate"
                                ? "amber"
                                : "rose"
                            }
                          >
                            {recipe.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <ChefHat size={16} className="shrink-0" style={{ color: "var(--text-faint)" }} />
                    </Link>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
