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
    { id: "tutorial", label: "Start Here", emoji: "📖" },
    { id: "free-form-loaves", label: "Free-Form Loaves", emoji: "🍞" },
    { id: "pan-loaves", label: "Pan Loaves", emoji: "🍞" },
    { id: "pizzas-flatbreads", label: "Pizza & Flatbreads", emoji: "🍕" },
    { id: "buns-rolls-more", label: "Rolls & More", emoji: "🥐" },
    { id: "sweets", label: "Sweets", emoji: "🧁" },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader title="Start a Bake" subtitle="Choose a recipe to begin" />

      {/* Active Bakes */}
      {activeBakes.length > 0 && (
        <div className="px-5 mb-6">
          <h2 className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-gentle-pulse" />
            In Progress
          </h2>
          <div className="space-y-2">
            {activeBakes.map((bake) => {
              const recipe = getRecipeById(bake.recipe_id);
              return (
                <Link
                  key={bake.id}
                  href={`/bake/${bake.recipe_id}?session=${bake.id}`}
                  className="flex items-center justify-between bg-amber-900/15 border border-amber-800/20 rounded-xl p-3.5 active:bg-amber-900/25 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-200">
                      {recipe?.title || bake.recipe_id}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Started{" "}
                      {formatDistanceToNow(new Date(bake.started_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-amber-500" />
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
              className="mb-6"
            >
              <h2 className="text-sm font-medium text-stone-400 mb-3 flex items-center gap-2">
                <span>{cat.emoji}</span>
                {cat.label}
                <span className="text-stone-600 text-xs">
                  ({catRecipes.length})
                </span>
              </h2>
              <div className="space-y-1.5">
                {catRecipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/bake/${recipe.id}`}
                    className="flex items-center justify-between bg-stone-900 rounded-xl p-3 border border-stone-800/50 active:bg-stone-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-200 truncate">
                        {recipe.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-stone-500 flex items-center gap-1">
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
                    <ChefHat size={16} className="text-stone-600 shrink-0" />
                  </Link>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
