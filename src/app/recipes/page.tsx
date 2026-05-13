"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { recipes, getCategories, books } from "@/data/recipes";

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

const diffColors: Record<string, { color: string; border: string }> = {
  beginner: { color: "var(--sage)", border: "var(--sage-soft)" },
  intermediate: { color: "var(--accent)", border: "var(--accent-soft)" },
  advanced: { color: "var(--rose)", border: "var(--rose)" },
};

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeBook, setActiveBook] = useState<string>("all");
  const [activeDifficulty, setActiveDifficulty] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("default");
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
    <div className="anim-rise proof-page" style={{ maxWidth: 1200 }}>
      {/* Title Block */}
      <div style={{ marginBottom: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          &sect; Library &middot; {recipes.length} formulas &middot; {books.length} volumes
        </div>
        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 300,
            fontSize: "clamp(48px, 8vw, 120px)",
            letterSpacing: "-.02em",
            lineHeight: 1.0,
            margin: 0,
            marginBottom: 16,
          }}
        >
          The <span className="italic">Library</span>
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: 640, fontSize: 16, lineHeight: 1.55, marginBottom: 24 }}>
          Every formula in our collection, from foundational loaves to weekend projects.
          Browse by category, difficulty, or simply search for what calls to you.
        </p>
        <div className="hairline" />
      </div>

      {/* Search + Filters */}
      <div style={{ paddingTop: 28, paddingBottom: 24 }}>
        {/* Search row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, borderBottom: ".5px solid var(--hairline)", paddingBottom: 2 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search formulas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              fontFamily: "var(--serif-display)",
              fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: 300,
              background: "transparent",
              border: "none",
              color: "var(--ink)",
              outline: "none",
              padding: "8px 0",
            }}
          />
          <span className="mono" style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {filtered.length} / {recipes.length}
          </span>
        </div>

        {/* Filter rows */}
        <FilterRow label="Category">
          {["all", ...categories.map((c) => c.id)].map((cat) => (
            <FilterLink
              key={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            >
              {categoryLabels[cat] || cat}
            </FilterLink>
          ))}
        </FilterRow>

        <FilterRow label="Level">
          {(["all", "beginner", "intermediate", "advanced"] as const).map((diff) => (
            <FilterLink
              key={diff}
              active={activeDifficulty === diff}
              onClick={() => setActiveDifficulty(diff)}
            >
              {diff === "all" ? "Any" : diff}
            </FilterLink>
          ))}
        </FilterRow>

        <FilterRow label="Volume">
          {[{ id: "all", title: "All" }, ...books].map((book) => (
            <FilterLink
              key={book.id}
              active={activeBook === book.id}
              onClick={() => setActiveBook(book.id)}
            >
              {book.title}
            </FilterLink>
          ))}
        </FilterRow>

        <FilterRow label="Sort">
          {(Object.keys(sortLabels) as SortOption[]).map((key) => (
            <FilterLink
              key={key}
              active={sort === key}
              onClick={() => setSort(key)}
            >
              {sortLabels[key]}
            </FilterLink>
          ))}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                fontFamily: "var(--serif-display)",
                fontSize: 14,
                color: "var(--accent)",
                fontStyle: "italic",
                marginLeft: 12,
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Clear all
            </button>
          )}
        </FilterRow>
      </div>

      {/* Recipe Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
          gap: 24,
          paddingBottom: 64,
        }}
      >
        {filtered.map((recipe, i) => {
          const diff = diffColors[recipe.difficulty] || diffColors.intermediate;
          const book = books.find((b) => b.id === recipe.bookId);
          return (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="rc-card"
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              {/* Image frame */}
              <div
                className="img-frame"
                style={{
                  aspectRatio: "4 / 5",
                  position: "relative",
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                {recipe.image ? (
                  <Image
                    src={recipe.image}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover", transition: "transform .4s ease" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, var(--card-2), var(--paper-2))",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--serif-display)",
                        fontSize: 64,
                        fontWeight: 300,
                        color: "var(--muted-2)",
                        opacity: 0.4,
                      }}
                    >
                      {recipe.title.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Number badge */}
                <span
                  className="mono"
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    fontSize: 10,
                    letterSpacing: ".06em",
                    padding: "5px 10px",
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                    borderRadius: 2,
                  }}
                >
                  {"№"} {String(i + 1).padStart(3, "0")}
                </span>

                {/* Difficulty pill */}
                <span
                  className="mono"
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    fontSize: 9.5,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    padding: "4px 10px",
                    border: `1px solid ${diff.border}`,
                    color: diff.color,
                    borderRadius: 2,
                    background: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {recipe.difficulty}
                </span>
              </div>

              {/* Card text */}
              <div style={{ padding: "0 2px" }}>
                {/* Eyebrow row */}
                <div
                  className="eyebrow"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span>{categoryLabels[recipe.category] || recipe.category}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                    {recipe.totalTime}
                    {recipe.hydration && <> &middot; {recipe.hydration}</>}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: "var(--serif-display)",
                    fontSize: "clamp(22px, 2.5vw, 26px)",
                    fontWeight: 400,
                    lineHeight: 1.15,
                    margin: 0,
                    marginBottom: 6,
                  }}
                >
                  {recipe.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.45,
                    color: "var(--muted)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {recipe.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p
            style={{
              fontFamily: "var(--serif-display)",
              fontStyle: "italic",
              fontSize: 28,
              color: "var(--muted)",
              marginBottom: 16,
            }}
          >
            Nothing in the larder for that.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="btn-link"
          >
            Start fresh
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Inline sub-components ── */

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
      <span
        className="eyebrow"
        style={{ minWidth: 80, flexShrink: 0 }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "baseline" }}>
        {children}
      </div>
    </div>
  );
}

function FilterLink({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--serif-display)",
        fontSize: 16,
        fontStyle: active ? "italic" : "normal",
        textDecoration: active ? "underline" : "none",
        textUnderlineOffset: 3,
        color: active ? "var(--ink)" : "var(--muted)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "2px 0",
        transition: "color .2s ease",
      }}
    >
      {children}
    </button>
  );
}
