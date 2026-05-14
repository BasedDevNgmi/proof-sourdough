"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getRecipeById, books } from "@/data/recipes";
import { supabase, type BakeSession } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { formatDistanceToNow } from "date-fns";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const recipe = getRecipeById(id);
  const [activeTab, setActiveTab] = useState<"overview" | "steps" | "tips" | "notes">("overview");
  const [pastBakes, setPastBakes] = useState<BakeSession[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [showStickyBar, setShowStickyBar] = useState(false);
  const heroCTARef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroCTARef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [recipe]);

  // Load checklist from localStorage
  useEffect(() => {
    if (!recipe) return;
    try {
      const stored = localStorage.getItem(`proof-checklist-${recipe.id}`);
      if (stored) setCheckedIngredients(new Set(JSON.parse(stored)));
    } catch {}
  }, [recipe?.id]);

  function toggleIngredient(key: string) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (recipe) {
        localStorage.setItem(`proof-checklist-${recipe.id}`, JSON.stringify([...next]));
      }
      return next;
    });
  }

  function allCheckedInGroup(group: string, items: { name: string }[]) {
    return items.length > 0 && items.every((_, i) => checkedIngredients.has(`${group}-${i}`));
  }

  useEffect(() => {
    if (!recipe) return;
    trackEvent("recipe_viewed", { recipe_id: recipe.id, recipe_title: recipe.title });
    supabase
      .from("bake_sessions")
      .select("*")
      .eq("recipe_id", recipe.id)
      .order("started_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setPastBakes(data);
      });
  }, [recipe]);

  if (!recipe) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p style={{ fontFamily: "var(--serif-display)", fontStyle: "italic", fontSize: 24, color: "var(--muted)" }}>
          Formula not found.
        </p>
      </div>
    );
  }

  const book = books.find((b) => b.id === recipe.bookId);
  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "steps" as const, label: "Steps" },
    { id: "tips" as const, label: "Tips" },
    { id: "notes" as const, label: "Notes" },
  ];

  function scaleWeight(weight: string): string {
    if (multiplier === 1) return weight;
    const match = weight.match(/^(\d+(?:\.\d+)?)\s*(g|ml|oz)?$/i);
    if (!match) return weight;
    const scaled = Math.round(parseFloat(match[1]) * multiplier);
    return `${scaled}${match[2] ? match[2] : ""}`;
  }

  // Split title so last word is italic
  const titleWords = recipe.title.split(" ");
  const titleMain = titleWords.slice(0, -1).join(" ");
  const titleLast = titleWords[titleWords.length - 1];

  // Hydration number for diagram
  const hydNum = recipe.hydration ? parseInt(recipe.hydration.replace("%", "")) || 75 : 75;

  return (
    <div className="anim-rise proof-page" style={{ maxWidth: 1100 }}>
      {/* Back Link */}
      <Link
        href="/recipes"
        className="btn-link"
        style={{ display: "inline-block", marginBottom: 28 }}
      >
        &larr; All formulas
      </Link>

      {/* Hero Section */}
      <div
        className="recipe-hero-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
          alignItems: "start",
          marginBottom: 48,
        }}
      >
        {/* Left: text */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            &sect; Formula &middot; {recipe.category.replace(/-/g, " ")} {book ? ` · ${book.title}` : ""}
          </div>

          <h1
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 300,
              fontSize: "clamp(48px, 7vw, 110px)",
              letterSpacing: "-.02em",
              lineHeight: 1.0,
              margin: 0,
              marginBottom: 16,
            }}
          >
            {titleMain ? <>{titleMain} </> : null}
            <span className="italic">{titleLast}</span>
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 20, maxWidth: 560 }}>
            {recipe.description}
          </p>

          {/* Pull quote */}
          {recipe.subtitle && (
            <blockquote
              style={{
                margin: "0 0 24px 0",
                padding: "12px 0 12px 20px",
                borderLeft: "2px solid var(--accent)",
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 18,
                color: "var(--ink-2)",
                lineHeight: 1.4,
              }}
            >
              {recipe.subtitle}
            </blockquote>
          )}

          {/* Spec Row */}
          <div
            style={{
              display: "flex",
              gap: 0,
              marginBottom: 28,
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Time", value: recipe.totalTime },
              { label: "Hydration", value: recipe.hydration || "—" },
              { label: "Yield", value: recipe.yield },
              { label: "Level", value: recipe.difficulty },
            ].map((spec, i) => (
              <div
                key={spec.label}
                style={{
                  padding: "12px 20px",
                  borderTop: ".5px solid var(--hairline)",
                  borderBottom: ".5px solid var(--hairline)",
                  borderRight: i < 3 ? ".5px solid var(--hairline)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--serif-display)",
                    fontSize: 20,
                    fontWeight: 400,
                    lineHeight: 1.2,
                    marginBottom: 2,
                  }}
                >
                  {spec.value}
                </div>
                <div className="eyebrow" style={{ fontSize: 9 }}>{spec.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div ref={heroCTARef} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
            <Link href={`/bake/${recipe.id}`} className="btn" style={{ textDecoration: "none" }}>
              Begin this bake
            </Link>
            <button type="button" className="btn-link">
              Save to shelf
            </button>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="mono"
                style={{
                  fontSize: 9.5,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: ".5px solid var(--hairline)",
                  color: "var(--muted)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: image */}
        <div>
          {recipe.image ? (
            <figure style={{ margin: 0 }}>
              <div
                className="img-frame"
                style={{
                  aspectRatio: "4 / 5",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
              <figcaption
                className="eyebrow"
                style={{ marginTop: 10, textAlign: "right" }}
              >
                {recipe.title}
              </figcaption>
            </figure>
          ) : (
            <div
              className="img-frame"
              style={{
                aspectRatio: "4 / 5",
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, var(--card-2), var(--paper-2))",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--serif-display)",
                  fontSize: 120,
                  fontWeight: 300,
                  color: "var(--muted-2)",
                  opacity: 0.3,
                }}
              >
                {recipe.title.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs + Scale */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
        {/* Tab bar */}
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scale selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="eyebrow" style={{ marginRight: 4 }}>Scale</span>
          {[0.5, 1, 1.5, 2, 3].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMultiplier(m)}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 999,
                background: multiplier === m ? "var(--ink)" : "transparent",
                color: multiplier === m ? "var(--paper)" : "var(--muted)",
                border: multiplier === m ? "none" : ".5px solid var(--hairline)",
                cursor: "pointer",
                transition: "all .2s ease",
              }}
            >
              {m}&times;
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ paddingBottom: 64 }}>
        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div>
            <div
              className="recipe-overview-grid"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}
            >
              {/* Left: Timeline */}
              <div>
                {recipe.timeline.length > 0 && (
                  <div style={{ marginBottom: 40 }}>
                    <div className="eyebrow" style={{ marginBottom: 20 }}>Timeline</div>
                    <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {recipe.timeline.map((step, i) => (
                        <li
                          key={i}
                          style={{
                            display: "flex",
                            gap: 16,
                            marginBottom: 20,
                            paddingBottom: 20,
                            borderBottom: i < recipe.timeline.length - 1 ? ".5px solid var(--hairline)" : "none",
                          }}
                        >
                          <span
                            className="mono"
                            style={{
                              fontSize: 12,
                              color: "var(--muted)",
                              flexShrink: 0,
                              width: 28,
                              paddingTop: 2,
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontFamily: "var(--serif-display)",
                                fontSize: 18,
                                fontWeight: 400,
                                marginBottom: 4,
                              }}
                            >
                              {step.name}
                            </div>
                            <div
                              className="mono"
                              style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}
                            >
                              {step.duration}
                            </div>
                            <div className="eyebrow" style={{ marginBottom: 4, fontSize: 9 }}>When</div>
                            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
                              {step.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Right: Formula Tables */}
              <div>
                {/* Levain */}
                {recipe.ingredients.levain && recipe.ingredients.levain.length > 0 && (
                  <FormulaTable
                    title="Levain"
                    group="levain"
                    items={recipe.ingredients.levain}
                    scaleWeight={scaleWeight}
                    checked={checkedIngredients}
                    onToggle={toggleIngredient}
                    allDone={allCheckedInGroup("levain", recipe.ingredients.levain)}
                  />
                )}

                {/* Main Dough */}
                <FormulaTable
                  title="Main Dough"
                  group="main"
                  items={recipe.ingredients.main}
                  scaleWeight={scaleWeight}
                  checked={checkedIngredients}
                  onToggle={toggleIngredient}
                  allDone={allCheckedInGroup("main", recipe.ingredients.main)}
                />

                {/* Additions */}
                {recipe.ingredients.additions && recipe.ingredients.additions.length > 0 && (
                  <FormulaTable
                    title="Additions"
                    group="additions"
                    items={recipe.ingredients.additions}
                    scaleWeight={scaleWeight}
                    checked={checkedIngredients}
                    onToggle={toggleIngredient}
                    allDone={allCheckedInGroup("additions", recipe.ingredients.additions)}
                  />
                )}

                {/* Filling */}
                {recipe.ingredients.filling && recipe.ingredients.filling.length > 0 && (
                  <FormulaTable
                    title="Filling"
                    group="filling"
                    items={recipe.ingredients.filling}
                    scaleWeight={scaleWeight}
                    checked={checkedIngredients}
                    onToggle={toggleIngredient}
                    allDone={allCheckedInGroup("filling", recipe.ingredients.filling)}
                  />
                )}

                {/* Topping */}
                {recipe.ingredients.topping && recipe.ingredients.topping.length > 0 && (
                  <FormulaTable
                    title="Topping"
                    group="topping"
                    items={recipe.ingredients.topping}
                    scaleWeight={scaleWeight}
                    checked={checkedIngredients}
                    onToggle={toggleIngredient}
                    allDone={allCheckedInGroup("topping", recipe.ingredients.topping)}
                  />
                )}

                {/* Hydration Diagram */}
                {recipe.hydration && (
                  <div style={{ marginTop: 32 }}>
                    <div className="eyebrow" style={{ marginBottom: 16 }}>Hydration Diagram</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <HydrationBar label="Flour" pct={100} color="var(--ink-2)" />
                      <HydrationBar label="Water" pct={hydNum} color="var(--accent)" />
                      <HydrationBar label="Salt" pct={2} color="var(--muted)" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Past Bakes */}
            {pastBakes.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div className="eyebrow" style={{ marginBottom: 16 }}>Your Bake History</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600 }}>
                  {pastBakes.map((bake) => (
                    <Link
                      key={bake.id}
                      href={`/journal/${bake.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderBottom: ".5px solid var(--hairline)",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "background .2s ease",
                      }}
                    >
                      <span style={{ fontSize: 14, color: "var(--ink-2)" }}>
                        {formatDistanceToNow(new Date(bake.started_at), { addSuffix: true })}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {bake.overall_rating && (
                          <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>
                            {bake.overall_rating}/5
                          </span>
                        )}
                        <span
                          className="mono"
                          style={{
                            fontSize: 10,
                            textTransform: "uppercase",
                            color: bake.status === "completed" ? "var(--sage)" : "var(--accent)",
                          }}
                        >
                          {bake.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Steps ── */}
        {activeTab === "steps" && (
          <div style={{ maxWidth: 720 }}>
            {recipe.steps.map((step) => (
              <div
                key={step.step}
                style={{
                  marginBottom: 36,
                  paddingBottom: 36,
                  borderBottom: ".5px solid var(--hairline)",
                }}
              >
                {/* Step header */}
                <div className="eyebrow" style={{ marginBottom: 10, display: "flex", gap: 12, alignItems: "baseline" }}>
                  <span>Step {step.step}</span>
                  {step.duration && (
                    <>
                      <span style={{ color: "var(--hairline)" }}>&middot;</span>
                      <span className="mono" style={{ fontSize: 10, letterSpacing: ".04em" }}>{step.duration}</span>
                    </>
                  )}
                  {step.temperature && (
                    <>
                      <span style={{ color: "var(--hairline)" }}>&middot;</span>
                      <span className="mono" style={{ fontSize: 10, letterSpacing: ".04em" }}>{step.temperature}</span>
                    </>
                  )}
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: "var(--serif-display)",
                    fontSize: 24,
                    fontWeight: 400,
                    margin: "0 0 10px 0",
                  }}
                >
                  {step.title}
                </h3>

                {/* Instructions */}
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)", marginBottom: step.tip ? 16 : 0 }}>
                  {step.instructions}
                </p>

                {/* Tip */}
                {step.tip && (
                  <blockquote
                    style={{
                      margin: 0,
                      padding: "12px 0 12px 18px",
                      borderLeft: "2px solid var(--accent)",
                      fontFamily: "var(--serif-body)",
                      fontStyle: "italic",
                      fontSize: 14,
                      color: "var(--ink-2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {step.tip}
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tips ── */}
        {activeTab === "tips" && (
          <div style={{ maxWidth: 720 }}>
            {recipe.tips.map((tip, i) => (
              <article
                key={i}
                style={{
                  marginBottom: 28,
                  paddingBottom: 28,
                  borderBottom: i < recipe.tips.length - 1 ? ".5px solid var(--hairline)" : "none",
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  &sect; {i + 1}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
                  {tip}
                </p>
              </article>
            ))}
            {recipe.tips.length === 0 && (
              <p
                style={{
                  fontFamily: "var(--serif-display)",
                  fontStyle: "italic",
                  fontSize: 20,
                  color: "var(--muted)",
                  padding: "40px 0",
                }}
              >
                No tips recorded for this formula.
              </p>
            )}
          </div>
        )}

        {/* ── Notes ── */}
        {activeTab === "notes" && (
          <div style={{ maxWidth: 720 }}>
            <p
              style={{
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 20,
                color: "var(--muted)",
                padding: "40px 0",
              }}
            >
              No notes yet for this formula.
            </p>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA — appears when hero CTA scrolls out */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 72,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "12px var(--pad-x)",
          background: "var(--paper)",
          borderTop: ".5px solid var(--hairline)",
          transform: showStickyBar ? "translateY(0)" : "translateY(calc(100% + 72px))",
          opacity: showStickyBar ? 1 : 0,
          transition: "transform .3s ease, opacity .25s ease",
          pointerEvents: showStickyBar ? "auto" : "none",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow" style={{ fontSize: 9, marginBottom: 2 }}>{recipe.category.replace(/-/g, " ")}</div>
          <div style={{
            fontFamily: "var(--serif-display)",
            fontSize: 18,
            fontWeight: 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {recipe.title}
          </div>
        </div>
        <Link
          href={`/bake/${recipe.id}`}
          className="btn"
          style={{ textDecoration: "none", flexShrink: 0, fontSize: 14, padding: "10px 22px" }}
        >
          Begin this bake
        </Link>
      </div>
    </div>
  );
}

/* ── Inline sub-components ── */

function FormulaTable({
  title,
  group,
  items,
  scaleWeight,
  checked,
  onToggle,
  allDone,
}: {
  title: string;
  group: string;
  items: { name: string; weight: string; bakerPercent?: string; note?: string }[];
  scaleWeight: (w: string) => string;
  checked: Set<string>;
  onToggle: (key: string) => void;
  allDone: boolean;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        className="eyebrow"
        style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}
      >
        <span>{title}</span>
        {allDone && (
          <span style={{ color: "var(--sage)", fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontFamily: "var(--serif-display)", fontSize: 13 }}>
            Ready
          </span>
        )}
      </div>
      <div>
        {items.map((ing, i) => {
          const ck = `${group}-${i}`;
          const isChecked = checked.has(ck);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: ".5px dotted var(--hairline)",
                opacity: isChecked ? 0.5 : 1,
                transition: "opacity .2s ease",
              }}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onToggle(ck)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 2,
                  border: "1px solid var(--ink)",
                  background: isChecked ? "var(--ink)" : "transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  padding: 0,
                  transition: "background .15s ease",
                }}
              >
                {isChecked && (
                  <svg width={10} height={10} viewBox="0 0 12 12" fill="none" stroke="var(--paper)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
              </button>

              {/* Name */}
              <span style={{ flex: 1, fontSize: 14.5, minWidth: 0 }}>
                {ing.name}
              </span>

              {/* Baker's percent */}
              {ing.bakerPercent && (
                <span className="mono" style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>
                  {ing.bakerPercent}
                </span>
              )}

              {/* Weight */}
              <span className="mono" style={{ fontSize: 13, color: "var(--ink)", flexShrink: 0, minWidth: 48, textAlign: "right" }}>
                {scaleWeight(ing.weight)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HydrationBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span className="mono" style={{ fontSize: 11, color: "var(--muted)", width: 44, textAlign: "right", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 8, background: "var(--hairline)", borderRadius: 1, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 1,
            transition: "width .4s ease",
          }}
        />
      </div>
      <span className="mono" style={{ fontSize: 11, color: "var(--muted)", width: 36, flexShrink: 0 }}>
        {pct}%
      </span>
    </div>
  );
}
