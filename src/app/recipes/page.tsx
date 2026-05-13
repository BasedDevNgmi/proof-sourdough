"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, BookOpen } from "lucide-react";
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

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeBook, setActiveBook] = useState<string>("all");
  const categories = getCategories();

  const filtered = useMemo(() => {
    let result = recipes;
    if (activeBook !== "all") {
      result = result.filter((r) => r.bookId === activeBook);
    }
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
  }, [activeCategory, activeBook, search]);

  const hasActiveFilters =
    search.trim() !== "" || activeCategory !== "all" || activeBook !== "all";

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Recipes"
          subtitle={`${recipes.length} recipes from ${books.length} books`}
        />

        {/* Search */}
        <div className="px-6 lg:px-8 mb-6">
          <div className="relative max-w-xl">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search recipes, ingredients, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl py-3 pl-11 pr-11 text-sm transition-all duration-300 focus:outline-none"
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors duration-200"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Book Filter */}
        <div className="px-6 lg:px-8 mb-4">
          <div className="flex gap-2.5 items-center overflow-x-auto hide-scrollbar pb-1">
            {[{ id: "all", title: "All Books", author: "", subtitle: "" }, ...books].map((book) => {
              const isActive = activeBook === book.id;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => setActiveBook(book.id)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300"
                  style={{
                    background: isActive
                      ? "var(--text)"
                      : "var(--bg-subtle)",
                    color: isActive ? "var(--bg)" : "var(--text-secondary)",
                    border: isActive
                      ? "1px solid var(--text)"
                      : "1px solid var(--border-subtle)",
                  }}
                >
                  {book.id !== "all" && (
                    <BookOpen size={13} className="shrink-0" style={{ opacity: 0.6 }} />
                  )}
                  <span>
                    {book.id === "all" ? "All Books" : (
                      <>
                        <span className="font-semibold">{book.title}</span>
                        {book.author && (
                          <span className="font-normal" style={{ opacity: 0.6 }}> by {book.author}</span>
                        )}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-6 lg:px-8 mb-8 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 pb-1">
            {["all", ...categories.map((c) => c.id)].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300"
                  style={{
                    background: isActive
                      ? "var(--accent)"
                      : "var(--bg-subtle)",
                    color: isActive ? "var(--bg)" : "var(--text-secondary)",
                    border: isActive
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border-subtle)",
                  }}
                >
                  {categoryLabels[cat] || cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="px-6 lg:px-8 mb-4">
          <p className="text-xs tracking-wide uppercase" style={{ color: "var(--text-faint)" }}>
            {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters && " found"}
          </p>
        </div>

        {/* Recipe Grid */}
        <div className="px-6 lg:px-8 pb-12">
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
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No recipes found
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                  setActiveBook("all");
                }}
                className="text-sm mt-3 font-medium transition-colors duration-200"
                style={{ color: "var(--accent)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--accent-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--accent)")
                }
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
