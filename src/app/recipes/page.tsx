"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, BookOpen, SlidersHorizontal, ChevronDown } from "lucide-react";
import { recipes, getCategories, books } from "@/data/recipes";
import { RecipeCard } from "@/components/ui/recipe-card";
import { PageHeader } from "@/components/ui/page-header";

const categoryLabels: Record<string, string> = {
  all: "All",
  tutorial: "Tutorial",
  "free-form-loaves": "Free-Form",
  "pan-loaves": "Pan Loaves",
  "pizzas-flatbreads": "Pizza & Flat",
  "buns-rolls-more": "Rolls & More",
  sweets: "Sweets",
};

type SortOption = "default" | "time-asc" | "time-desc" | "hydration-asc" | "hydration-desc" | "alpha";

const sortLabels: Record<SortOption, string> = {
  default: "Default",
  "alpha": "A → Z",
  "time-asc": "Quickest",
  "time-desc": "Longest",
  "hydration-asc": "Low hydration",
  "hydration-desc": "High hydration",
};

function parseTimeToMinutes(time: string): number {
  const h = time.match(/(\d+)\s*h/i);
  const m = time.match(/(\d+)\s*m/i);
  const d = time.match(/(\d+)\s*d/i);
  let total = 0;
  if (d) total += parseInt(d[1]) * 1440;
  if (h) total += parseInt(h[1]) * 60;
  if (m) total += parseInt(m[1]);
  if (total === 0) {
    const num = parseInt(time);
    if (!isNaN(num)) total = num * 60;
  }
  return total;
}

function parseHydration(h?: string): number {
  if (!h) return 0;
  return parseInt(h.replace("%", "")) || 0;
}

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeBook, setActiveBook] = useState<string>("all");
  const [activeDifficulty, setActiveDifficulty] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("default");
  const [showSort, setShowSort] = useState(false);
  const categories = getCategories();

  const filtered = useMemo(() => {
    let result = recipes;
    if (activeBook !== "all") {
      result = result.filter((r) => r.bookId === activeBook);
    }
    if (activeCategory !== "all") {
      result = result.filter((r) => r.category === activeCategory);
    }
    if (activeDifficulty !== "all") {
      result = result.filter((r) => r.difficulty === activeDifficulty);
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

    if (sort !== "default") {
      result = [...result].sort((a, b) => {
        switch (sort) {
          case "alpha": return a.title.localeCompare(b.title);
          case "time-asc": return parseTimeToMinutes(a.totalTime) - parseTimeToMinutes(b.totalTime);
          case "time-desc": return parseTimeToMinutes(b.totalTime) - parseTimeToMinutes(a.totalTime);
          case "hydration-asc": return parseHydration(a.hydration) - parseHydration(b.hydration);
          case "hydration-desc": return parseHydration(b.hydration) - parseHydration(a.hydration);
          default: return 0;
        }
      });
    }

    return result;
  }, [activeCategory, activeBook, activeDifficulty, search, sort]);

  const activeFilterCount =
    (activeCategory !== "all" ? 1 : 0) +
    (activeBook !== "all" ? 1 : 0) +
    (activeDifficulty !== "all" ? 1 : 0) +
    (sort !== "default" ? 1 : 0);

  function clearAll() {
    setSearch("");
    setActiveCategory("all");
    setActiveBook("all");
    setActiveDifficulty("all");
    setSort("default");
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Recipes"
          subtitle={`${recipes.length} recipes from ${books.length} books`}
        />

        {/* Sticky filter bar */}
        <div
          className="sticky top-0 z-30 px-6 lg:px-8 pb-4 pt-2 space-y-3"
          style={{ background: "var(--bg)", borderBottom: "1px solid transparent" }}
        >
          {/* Search row */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-xl">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="What are you in the mood for?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl py-2.5 pl-11 pr-11 text-sm transition-all duration-300 focus:outline-none"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--card)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.background = "var(--bg-subtle)";
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: sort !== "default" ? "var(--accent-surface)" : "var(--bg-subtle)",
                  border: sort !== "default" ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                  color: sort !== "default" ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">{sort === "default" ? "Sort" : sortLabels[sort]}</span>
                <ChevronDown size={12} />
              </button>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-1 z-50 rounded-xl py-1 min-w-[160px]"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    }}
                  >
                    {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setSort(key); setShowSort(false); }}
                        className="w-full text-left px-4 py-2 text-xs transition-colors"
                        style={{
                          color: sort === key ? "var(--accent)" : "var(--text-secondary)",
                          background: sort === key ? "var(--accent-surface)" : "transparent",
                        }}
                      >
                        {sortLabels[key]}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Filter pills — all in one row */}
          <div className="flex gap-2 items-center overflow-x-auto hide-scrollbar pb-0.5">
            {/* Book pills */}
            {[{ id: "all", title: "All Books", author: "" }, ...books].map((book) => {
              const isActive = activeBook === book.id;
              return (
                <button
                  key={`book-${book.id}`}
                  type="button"
                  onClick={() => setActiveBook(book.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200"
                  style={{
                    background: isActive ? "var(--text)" : "transparent",
                    color: isActive ? "var(--bg)" : "var(--text-muted)",
                    border: isActive ? "1px solid var(--text)" : "1px solid var(--border-subtle)",
                  }}
                >
                  {book.id !== "all" && <BookOpen size={11} className="shrink-0" />}
                  {book.id === "all" ? "All Books" : book.title}
                </button>
              );
            })}

            <div className="w-px h-4 shrink-0" style={{ background: "var(--border-subtle)" }} />

            {/* Category pills */}
            {["all", ...categories.map((c) => c.id)].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={`cat-${cat}`}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200"
                  style={{
                    background: isActive ? "var(--accent)" : "transparent",
                    color: isActive ? "var(--bg)" : "var(--text-muted)",
                    border: isActive ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
                  }}
                >
                  {categoryLabels[cat] || cat}
                </button>
              );
            })}

            <div className="w-px h-4 shrink-0" style={{ background: "var(--border-subtle)" }} />

            {/* Difficulty pills */}
            {(["all", "beginner", "intermediate", "advanced"] as const).map((diff) => {
              const isActive = activeDifficulty === diff;
              const colors: Record<string, string> = {
                beginner: "#34d399",
                intermediate: "#fbbf24",
                advanced: "#fb7185",
              };
              return (
                <button
                  key={`diff-${diff}`}
                  type="button"
                  onClick={() => setActiveDifficulty(diff)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 capitalize"
                  style={{
                    background: isActive && diff !== "all"
                      ? colors[diff]
                      : isActive
                        ? "var(--text)"
                        : "transparent",
                    color: isActive
                      ? diff === "all" ? "var(--bg)" : "#fff"
                      : "var(--text-muted)",
                    border: isActive
                      ? `1px solid ${diff === "all" ? "var(--text)" : colors[diff]}`
                      : "1px solid var(--border-subtle)",
                  }}
                >
                  {diff === "all" ? "Any level" : diff}
                </button>
              );
            })}

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-all duration-200"
                style={{ color: "var(--accent)" }}
              >
                <X size={12} />
                Clear {activeFilterCount}
              </button>
            )}
          </div>

          {/* Result count — inline */}
          <p className="text-[11px] tracking-wide uppercase" style={{ color: "var(--text-faint)" }}>
            {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
            {(search || activeFilterCount > 0) && " found"}
          </p>
        </div>

        {/* Recipe Grid */}
        <div className="px-6 lg:px-8 pb-12 pt-2">
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
              {filtered.map((recipe, i) => (
                <RecipeCard key={recipe.id} recipe={recipe} index={i} />
              ))}
            </div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-3 w-fit"
              >
                <Search size={32} style={{ color: "var(--text-ghost)" }} />
              </motion.div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Nothing here. Even sourdough starter needs something to work with.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="text-sm mt-3 font-medium"
                style={{ color: "var(--accent)" }}
              >
                Start fresh
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
