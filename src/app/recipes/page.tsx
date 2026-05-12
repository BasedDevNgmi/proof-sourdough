"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { recipes, getCategories } from "@/data/recipes";
import { RecipeCard } from "@/components/ui/recipe-card";
import { PageHeader } from "@/components/ui/page-header";
import type { RecipeCategory } from "@/data/recipes";

const categoryLabels: Record<string, string> = {
  all: "All",
  tutorial: "Tutorial",
  "free-form-loaves": "Free-Form",
  "pan-loaves": "Pan Loaves",
  "pizzas-flatbreads": "Pizza & Flat",
  "buns-rolls-more": "Rolls & More",
  sweets: "Sweets",
};

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const categories = getCategories();

  const filtered = useMemo(() => {
    let result = recipes;
    if (activeCategory !== "all") {
      result = result.filter((r) => r.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Recipes" subtitle={`${recipes.length} recipes from The Perfect Loaf`} />

        {/* Search */}
        <div className="px-5 mb-4">
          <div className="relative max-w-xl">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500"
            />
            <input
              type="text"
              placeholder="Search recipes, ingredients, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800/50 rounded-xl py-2.5 pl-10 pr-10 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-stone-700 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-5 mb-5 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 pb-1">
            {["all", ...categories.map((c) => c.id)].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-amber-500 text-stone-950"
                    : "bg-stone-800/50 text-stone-400 active:bg-stone-700 hover:bg-stone-700/50"
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="px-5 mb-3">
          <p className="text-xs text-stone-600">
            {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Recipe Grid */}
        <div className="px-5 pb-8">
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((recipe, i) => (
                <RecipeCard key={recipe.id} recipe={recipe} index={i} />
              ))}
            </div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-stone-500 text-sm">No recipes found</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="text-amber-500 text-sm mt-2"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
