"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getRecipeById, books } from "@/data/recipes";
import { supabase, type BakeSession } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/ui/pill";
import { Icon } from "@/components/illustrations/icons";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";
import { Steam } from "@/components/illustrations/steam";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const recipe = getRecipeById(id);
  const [activeTab, setActiveTab] = useState<"overview" | "steps" | "tips">(
    "overview"
  );
  const [pastBakes, setPastBakes] = useState<BakeSession[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

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
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--ink-mute)" }}>Recipe not found</p>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "steps" as const, label: "Steps" },
    { id: "tips" as const, label: "Tips" },
  ];

  function scaleWeight(weight: string): string {
    if (multiplier === 1) return weight;
    const match = weight.match(/^(\d+(?:\.\d+)?)\s*(g|ml|oz)?$/i);
    if (!match) return weight;
    const scaled = Math.round(parseFloat(match[1]) * multiplier);
    return `${scaled}${match[2] ? match[2] : ""}`;
  }

  return (
    <div className="anim-rise proof-page" style={{ maxWidth: 1100 }}>
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 12px", background: "transparent", border: "1px solid var(--border)",
          borderRadius: 999, color: "var(--ink-soft)", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
          marginBottom: 20,
        }}
      >
        <Icon.back width={14} height={14} />
        All recipes
      </button>

      {/* Hero grid: text left, illustration right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", marginBottom: 40 }}>
        <div>
          <div className="label" style={{ marginBottom: 10 }}>
            {recipe.category.replace(/-/g, " ")}
            {(() => { const book = books.find(b => b.id === recipe.bookId); return book ? ` · ${book.title}` : ""; })()}
          </div>
          <h1 className="display" style={{ fontSize: 56, margin: 0, marginBottom: 12, lineHeight: 0.95 }}>{recipe.title}</h1>
          {recipe.subtitle && (
            <div style={{ fontSize: 14, color: "var(--ink-mute)", marginBottom: 8 }}>{recipe.subtitle}</div>
          )}
          <div style={{ fontSize: 16, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 14 }}>{recipe.description}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 28, flexWrap: "wrap" }}>
            <div style={{ padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>{recipe.totalTime}</div>
              <div className="label" style={{ fontSize: 10, marginTop: 2 }}>total</div>
            </div>
            {recipe.hydration && (
              <div style={{ padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
                <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>{recipe.hydration}</div>
                <div className="label" style={{ fontSize: 10, marginTop: 2 }}>hydration</div>
              </div>
            )}
            <Pill tone={recipe.difficulty === "beginner" ? "beginner" : recipe.difficulty === "advanced" ? "advanced" : "intermediate"} style={{ fontSize: 12, padding: "6px 12px" }}>
              {recipe.difficulty}
            </Pill>
          </div>
          <Link
            href={`/bake/${recipe.id}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 26px", background: "var(--crust)", border: "none", color: "#1c1611",
              borderRadius: 12, fontWeight: 700, fontFamily: "inherit", fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 8px 24px -8px rgba(232,155,60,0.5)",
              transition: "transform 0.2s var(--ease-bounce)",
            }}
          >
            <Icon.chef width={18} height={18} /> Start this bake
          </Link>
        </div>

        {/* Hero image / illustration */}
        {recipe.image ? (
          <div style={{
            position: "relative", aspectRatio: "1 / 1",
            borderRadius: "var(--radius-xl)", border: "1px solid var(--border)",
            overflow: "hidden",
          }}>
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div style={{
            position: "relative", aspectRatio: "1 / 1",
            background: "radial-gradient(circle at 50% 30%, var(--surface-2), var(--surface))",
            borderRadius: "var(--radius-xl)", border: "1px solid var(--border)",
            display: "grid", placeItems: "center", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(circle at 20% 30%, var(--crust-soft) 1.5px, transparent 2.5px),
                           radial-gradient(circle at 60% 70%, var(--leaf-soft) 1px, transparent 2px),
                           radial-gradient(circle at 80% 20%, var(--jam-soft) 1px, transparent 2px)`,
              backgroundSize: "60px 60px", opacity: 0.3,
            }} />
            <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)", width: 60, height: 60 }}>
              <Steam count={6} />
            </div>
            <div className="anim-float">
              <BreadIllustration seed={recipe.id} size={300} />
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {recipe.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-md"
            style={{
              color: "var(--ink-faint)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs" style={{ color: "var(--ink-mute)" }}>
        <span className="flex items-center gap-1.5">
          <Icon.clock width={13} height={13} /> {recipe.totalTime}
        </span>
        <span className="flex items-center gap-1.5">
          <Icon.clock width={13} height={13} /> {recipe.activeTime} active
        </span>
        {recipe.hydration && (
          <span className="flex items-center gap-1.5">💧 {recipe.hydration}</span>
        )}
        <span className="flex items-center gap-1.5">{recipe.yield}</span>
      </div>

      {/* Book source */}
      {(() => {
        const book = books.find(b => b.id === recipe.bookId);
        return book ? (
          <div className="flex items-center gap-2 mb-6 text-xs" style={{ color: "var(--ink-mute)" }}>
            <div className="w-6 h-8 rounded-sm flex items-center justify-center" style={{ background: book.coverColor }}>
              <span className="text-[7px] text-white/80 font-bold">{book.title.charAt(0)}</span>
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--ink-soft)" }}>
                {book.title}{book.subtitle ? `: ${book.subtitle}` : ""}
              </p>
              <p className="text-[11px]" style={{ color: "var(--ink-faint)" }}>by {book.author}</p>
            </div>
          </div>
        ) : null;
      })()}

      {/* Divider */}
      <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 24 }} />

      {/* Tabs */}
      <div className="mb-6">
        <div
          className="flex gap-1 rounded-xl p-1 max-w-sm"
          style={{ background: "var(--surface)" }}
        >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2.5 text-xs font-medium rounded-lg transition-all duration-200"
                style={{
                  background:
                    activeTab === tab.id ? "var(--surface-2)" : "transparent",
                  color:
                    activeTab === tab.id
                      ? "var(--ink)"
                      : "var(--ink-mute)",
                  boxShadow:
                    activeTab === tab.id ? "var(--shadow-sm)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      {/* Tab Content */}
      <div className="pb-12">
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              {/* Scale Selector */}
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="text-xs uppercase tracking-wider font-medium"
                  style={{ color: "var(--ink-mute)" }}
                >
                  Scale
                </span>
                <div className="flex gap-1.5">
                  {[0.5, 1, 1.5, 2, 3, 4].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMultiplier(m)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background:
                          multiplier === m
                            ? "var(--crust)"
                            : "var(--surface)",
                        color:
                          multiplier === m
                            ? "var(--bg)"
                            : "var(--ink-soft)",
                        border:
                          multiplier === m
                            ? "none"
                            : "1px solid var(--border)",
                      }}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients in side-by-side grid on desktop */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-10">
                <div>
                  {/* Timeline */}
                  {recipe.timeline.length > 0 && (
                    <div className="mb-8">
                      <h3
                        className="text-[11px] font-medium uppercase tracking-widest mb-4"
                        style={{ color: "var(--ink-mute)" }}
                      >
                        Timeline
                      </h3>
                      <div className="space-y-2.5">
                        {recipe.timeline.map((step, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-4 rounded-xl p-4"
                            style={{
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium mt-0.5 shrink-0"
                              style={{
                                background: "var(--surface)",
                                color: "var(--ink-faint)",
                              }}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium"
                                style={{ color: "var(--ink)" }}
                              >
                                {step.name}
                              </p>
                              <p
                                className="text-[11px] mt-0.5"
                                style={{ color: "var(--ink-mute)" }}
                              >
                                {step.duration}
                              </p>
                              <p
                                className="text-xs mt-1.5 leading-relaxed"
                                style={{ color: "var(--ink-soft)" }}
                              >
                                {step.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {/* Levain Ingredients */}
                  {recipe.ingredients.levain && recipe.ingredients.levain.length > 0 && (
                    <div className="mb-8">
                      <h3
                        className="text-[11px] font-medium uppercase tracking-widest mb-4 flex items-center gap-2"
                        style={{ color: "var(--ink-mute)" }}
                      >
                        Levain
                        {allCheckedInGroup("levain", recipe.ingredients.levain) && (
                          <span className="text-[10px] font-normal normal-case tracking-normal" style={{ color: "var(--crust)" }}>Ready!</span>
                        )}
                      </h3>
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {recipe.ingredients.levain.map((ing, i) => {
                          const ck = `levain-${i}`;
                          const on = checkedIngredients.has(ck);
                          return (
                          <div
                            key={i}
                            onClick={() => toggleIngredient(ck)}
                            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-opacity"
                            style={{
                              borderBottom:
                                i < recipe.ingredients.levain!.length - 1
                                  ? "1px solid var(--border)"
                                  : "none",
                              opacity: on ? 0.4 : 1,
                            }}
                          >
                            <span
                              className="text-sm"
                              style={{ color: "var(--ink-soft)", textDecoration: on ? "line-through" : "none" }}
                            >
                              {ing.name}
                            </span>
                            <div className="flex items-center gap-3">
                              {ing.bakerPercent && (
                                <span
                                  className="text-[10px] tracking-wide"
                                  style={{ color: "var(--ink-faint)" }}
                                >
                                  {ing.bakerPercent}
                                </span>
                              )}
                              <span
                                className="text-sm font-medium tabular-nums"
                                style={{ color: "var(--ink)", textDecoration: on ? "line-through" : "none" }}
                              >
                                {scaleWeight(ing.weight)}
                              </span>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Main Ingredients */}
                  <div className="mb-8">
                    <h3
                      className="text-[11px] font-medium uppercase tracking-widest mb-4 flex items-center gap-2"
                      style={{ color: "var(--ink-mute)" }}
                    >
                      Main Dough
                      {allCheckedInGroup("main", recipe.ingredients.main) && (
                        <span className="text-[10px] font-normal normal-case tracking-normal" style={{ color: "var(--crust)" }}>Ready!</span>
                      )}
                    </h3>
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {recipe.ingredients.main.map((ing, i) => {
                        const ck = `main-${i}`;
                        const on = checkedIngredients.has(ck);
                        return (
                        <div
                          key={i}
                          onClick={() => toggleIngredient(ck)}
                          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-opacity"
                          style={{
                            borderBottom:
                              i < recipe.ingredients.main.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                            opacity: on ? 0.4 : 1,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <span
                              className="text-sm"
                              style={{ color: "var(--ink-soft)", textDecoration: on ? "line-through" : "none" }}
                            >
                              {ing.name}
                            </span>
                            {ing.note && (
                              <span
                                className="text-[10px] ml-2"
                                style={{ color: "var(--ink-faint)" }}
                              >
                                {ing.note}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {ing.bakerPercent && (
                              <span
                                className="text-[10px] tracking-wide"
                                style={{ color: "var(--ink-faint)" }}
                              >
                                {ing.bakerPercent}
                              </span>
                            )}
                            <span
                              className="text-sm font-medium tabular-nums"
                              style={{ color: "var(--ink)", textDecoration: on ? "line-through" : "none" }}
                            >
                              {scaleWeight(ing.weight)}
                            </span>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additions */}
                  {recipe.ingredients.additions &&
                    recipe.ingredients.additions.length > 0 && (
                      <div className="mb-8">
                        <h3
                          className="text-[11px] font-medium uppercase tracking-widest mb-4 flex items-center gap-2"
                          style={{ color: "var(--ink-mute)" }}
                        >
                          Additions
                          {allCheckedInGroup("additions", recipe.ingredients.additions) && (
                            <span className="text-[10px] font-normal normal-case tracking-normal" style={{ color: "var(--crust)" }}>Ready!</span>
                          )}
                        </h3>
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {recipe.ingredients.additions.map((ing, i) => {
                            const ck = `additions-${i}`;
                            const on = checkedIngredients.has(ck);
                            return (
                            <div
                              key={i}
                              onClick={() => toggleIngredient(ck)}
                              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-opacity"
                              style={{
                                borderBottom:
                                  i < recipe.ingredients.additions!.length - 1
                                    ? "1px solid var(--border)"
                                    : "none",
                                opacity: on ? 0.4 : 1,
                              }}
                            >
                              <span
                                className="text-sm"
                                style={{ color: "var(--ink-soft)", textDecoration: on ? "line-through" : "none" }}
                              >
                                {ing.name}
                              </span>
                              <span
                                className="text-sm font-medium tabular-nums"
                                style={{ color: "var(--ink)", textDecoration: on ? "line-through" : "none" }}
                              >
                                {scaleWeight(ing.weight)}
                              </span>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Filling */}
                  {recipe.ingredients.filling &&
                    recipe.ingredients.filling.length > 0 && (
                      <div className="mb-8">
                        <h3
                          className="text-[11px] font-medium uppercase tracking-widest mb-4 flex items-center gap-2"
                          style={{ color: "var(--ink-mute)" }}
                        >
                          Filling
                          {allCheckedInGroup("filling", recipe.ingredients.filling) && (
                            <span className="text-[10px] font-normal normal-case tracking-normal" style={{ color: "var(--crust)" }}>Ready!</span>
                          )}
                        </h3>
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {recipe.ingredients.filling.map((ing, i) => {
                            const ck = `filling-${i}`;
                            const on = checkedIngredients.has(ck);
                            return (
                            <div
                              key={i}
                              onClick={() => toggleIngredient(ck)}
                              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-opacity"
                              style={{
                                borderBottom:
                                  i < recipe.ingredients.filling!.length - 1
                                    ? "1px solid var(--border)"
                                    : "none",
                                opacity: on ? 0.4 : 1,
                              }}
                            >
                              <span
                                className="text-sm"
                                style={{ color: "var(--ink-soft)", textDecoration: on ? "line-through" : "none" }}
                              >
                                {ing.name}
                              </span>
                              <span
                                className="text-sm font-medium tabular-nums"
                                style={{ color: "var(--ink)", textDecoration: on ? "line-through" : "none" }}
                              >
                                {scaleWeight(ing.weight)}
                              </span>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Past Bakes */}
              {pastBakes.length > 0 && (
                <div className="mt-2">
                  <h3
                    className="text-[11px] font-medium uppercase tracking-widest mb-4 flex items-center gap-2"
                    style={{ color: "var(--ink-mute)" }}
                  >
                    <Icon.clock width={12} height={12} /> Your Bake History
                  </h3>
                  <div className="space-y-2.5 max-w-xl">
                    {pastBakes.map((bake) => (
                      <Link
                        key={bake.id}
                        href={`/journal/${bake.id}`}
                        className="flex items-center justify-between rounded-xl p-4 transition-colors"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <p
                          className="text-xs"
                          style={{ color: "var(--ink-soft)" }}
                        >
                          {formatDistanceToNow(new Date(bake.started_at), {
                            addSuffix: true,
                          })}
                        </p>
                        <div className="flex items-center gap-2">
                          {bake.overall_rating && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--crust)" }}
                            >
                              {bake.overall_rating}★
                            </span>
                          )}
                          <Badge
                            variant={
                              bake.status === "completed" ? "emerald" : "amber"
                            }
                          >
                            {bake.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "steps" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="space-y-3.5 max-w-3xl"
            >
              {recipe.steps.map((step) => (
                <div
                  key={step.step}
                  className="rounded-xl p-5"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
                      style={{
                        background: "rgba(232,155,60,0.12)",
                        color: "var(--crust)",
                      }}
                    >
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h4
                        className="text-sm font-medium"
                        style={{ color: "var(--ink)" }}
                      >
                        {step.title}
                      </h4>
                      {step.duration && (
                        <p
                          className="text-[11px] mt-1 flex items-center gap-1"
                          style={{ color: "var(--ink-mute)" }}
                        >
                          <Icon.clock width={10} height={10} /> {step.duration}
                        </p>
                      )}
                      <p
                        className="text-sm mt-2.5 leading-relaxed"
                        style={{ color: "var(--ink-soft)" }}
                      >
                        {step.instructions}
                      </p>
                      {step.temperature && (
                        <p
                          className="text-xs mt-2.5 flex items-center gap-1"
                          style={{ color: "var(--crust)" }}
                        >
                          {step.temperature}
                        </p>
                      )}
                      {step.tip && (
                        <div
                          className="mt-3 rounded-lg p-3"
                          style={{
                            background: "var(--surface)",
                          }}
                        >
                          <p
                            className="text-base flex items-start gap-2 leading-relaxed"
                            style={{
                              color: "var(--ink-soft)",
                              fontFamily: "var(--font-caveat)",
                            }}
                          >
                            <span className="mt-1 shrink-0" style={{ fontSize: 14 }}>💡</span>
                            {step.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "tips" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="space-y-3.5 max-w-3xl"
            >
              {recipe.tips.map((tip, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 flex items-start gap-4"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span className="mt-1 shrink-0" style={{ fontSize: 16 }}>💡</span>
                  <p
                    className="text-base leading-relaxed"
                    style={{
                      color: "var(--ink-soft)",
                      fontFamily: "var(--font-caveat)",
                    }}
                  >
                    {tip}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    );
}
