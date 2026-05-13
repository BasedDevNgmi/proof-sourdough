"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/illustrations/icons";
import { Chip } from "@/components/ui/chip";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";
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

        {/* Filter bar */}
        <div
          className="z-30 px-6 lg:px-8 pb-4 pt-2 space-y-3"
          style={{ background: "var(--bg)" }}
        >
          {/* Search row */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-xl">
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--ink-mute)" }}
              >
                <Icon.search width={18} height={18} />
              </div>
              <input
                type="text"
                placeholder="What are you in the mood for?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl py-2.5 pl-11 pr-11 text-sm transition-all duration-300 focus:outline-none"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--ink)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--surface)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--surface)";
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md"
                  style={{ color: "var(--ink-mute)", fontSize: 18, lineHeight: 1, fontWeight: 500 }}
                >
                  ×
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
                  background: sort !== "default" ? "var(--accent-surface)" : "var(--surface)",
                  border: sort !== "default" ? "1px solid var(--crust)" : "1px solid var(--border)",
                  color: sort !== "default" ? "var(--crust)" : "var(--ink-soft)",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                  <path d="M4 6h16M4 12h10M4 18h6" />
                </svg>
                <span className="hidden sm:inline">{sort === "default" ? "Sort" : sortLabels[sort]}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-1 z-50 rounded-xl py-1 min-w-[160px]"
                    style={{
                      background: "var(--surface)",
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
                          color: sort === key ? "var(--crust)" : "var(--ink-soft)",
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
            {[{ id: "all", title: "All Books" }, ...books].map((book) => (
              <Chip key={`book-${book.id}`} active={activeBook === book.id} onClick={() => setActiveBook(book.id)}>
                {book.id !== "all" && <Icon.book width={12} height={12} />}
                {book.id === "all" ? "All Books" : book.title}
              </Chip>
            ))}

            <div className="w-px h-4 shrink-0" style={{ background: "var(--border)" }} />

            {/* Category pills */}
            {["all", ...categories.map((c) => c.id)].map((cat) => (
              <Chip key={`cat-${cat}`} active={activeCategory === cat} small onClick={() => setActiveCategory(cat)}>
                {categoryLabels[cat] || cat}
              </Chip>
            ))}

            <div className="w-px h-4 shrink-0" style={{ background: "var(--border)" }} />

            {/* Difficulty pills */}
            {(["all", "beginner", "intermediate", "advanced"] as const).map((diff) => (
              <Chip key={`diff-${diff}`} active={activeDifficulty === diff} small onClick={() => setActiveDifficulty(diff)}>
                {diff === "all" ? "Any level" : diff}
              </Chip>
            ))}

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-all duration-200"
                style={{ color: "var(--crust)" }}
              >
                × Clear {activeFilterCount}
              </button>
            )}
          </div>

          {/* Result count — inline */}
          <p className="text-[11px] tracking-wide uppercase" style={{ color: "var(--ink-faint)" }}>
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
            <div className="text-center py-20">
              <div style={{ opacity: 0.4, marginBottom: 14 }}>
                <BreadIllustration seed="empty" size={120} />
              </div>
              <div className="display" style={{ fontSize: 28, marginBottom: 6 }}>no matches.</div>
              <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginBottom: 4 }}>maybe a pizza instead?</div>
              <button
                type="button"
                onClick={clearAll}
                className="text-sm mt-3 font-medium"
                style={{ color: "var(--crust)" }}
              >
                Start fresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
