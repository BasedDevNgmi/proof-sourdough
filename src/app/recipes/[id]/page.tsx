"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Droplets,
  Gauge,
  ChefHat,
  Scale,
  Timer,
  Lightbulb,
  History,
} from "lucide-react";
import { getRecipeById, books } from "@/data/recipes";
import { supabase, type BakeSession } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const difficultyVariant = {
  beginner: "emerald" as const,
  intermediate: "amber" as const,
  advanced: "rose" as const,
};

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
  const tipRotations = useRef<Record<string, number>>({});

  function getTipRotation(key: string): number {
    if (!tipRotations.current[key]) {
      tipRotations.current[key] = -0.3 - Math.random() * 0.7;
    }
    return tipRotations.current[key];
  }
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
        <p style={{ color: "var(--text-muted)" }}>Recipe not found</p>
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

  const hasImage = !!recipe.image;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero Image Header or Text-only Header */}
      {hasImage ? (
        <div className="relative h-64 lg:h-80 w-full overflow-hidden">
          <Image
            src={recipe.image!}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlay fading to background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--bg) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)",
            }}
          />
          {/* Back button over image */}
          <div className="absolute top-0 left-0 right-0 max-w-4xl mx-auto px-6 pt-14 lg:pt-10">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-white/80 text-sm active:text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
          {/* Title overlaid at bottom */}
          <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-6 pb-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant={difficultyVariant[recipe.difficulty]}>
                {recipe.difficulty}
              </Badge>
              <h1
                className="font-[family-name:var(--font-playfair)] text-3xl lg:text-5xl font-semibold tracking-tight mt-2 leading-tight"
                style={{ color: "#f5f5f4" }}
              >
                {recipe.title}
              </h1>
              {recipe.subtitle && (
                <p
                  className="text-sm mt-1.5 tracking-wide"
                  style={{ color: "rgba(245,245,244,0.6)" }}
                >
                  {recipe.subtitle}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6 pt-14 lg:pt-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant={difficultyVariant[recipe.difficulty]}>
              {recipe.difficulty}
            </Badge>
            <h1
              className="font-[family-name:var(--font-playfair)] text-3xl lg:text-5xl font-semibold tracking-tight mt-3 leading-tight"
              style={{ color: "var(--text)" }}
            >
              {recipe.title}
            </h1>
            {recipe.subtitle && (
              <p
                className="text-sm mt-1.5 tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {recipe.subtitle}
              </p>
            )}
          </motion.div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Description + Meta section */}
        <div className={`px-6 ${hasImage ? "pt-6" : "pt-5"} pb-2`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <p
              className="text-sm leading-relaxed max-w-2xl"
              style={{ color: "var(--text-secondary)" }}
            >
              {recipe.description}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mt-5 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {recipe.totalTime}
              </span>
              <span className="flex items-center gap-1.5">
                <Timer size={13} /> {recipe.activeTime} active
              </span>
              {recipe.hydration && (
                <span className="flex items-center gap-1.5">
                  <Droplets size={13} /> {recipe.hydration}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Scale size={13} /> {recipe.yield}
              </span>
            </div>

            {/* Book source */}
            {(() => {
              const book = books.find(b => b.id === recipe.bookId);
              return book ? (
                <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  <div className="w-6 h-8 rounded-sm flex items-center justify-center" style={{ background: book.coverColor }}>
                    <span className="text-[7px] text-white/80 font-bold">{book.title.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
                      {book.title}{book.subtitle ? `: ${book.subtitle}` : ""}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>by {book.author}</p>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-md"
                  style={{
                    color: "var(--text-faint)",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Start Bake CTA */}
        <div className="px-6 py-6">
          <Link
            href={`/bake/${recipe.id}`}
            className="flex items-center justify-center gap-2 w-full md:w-auto md:px-14 font-semibold text-sm py-3.5 rounded-xl transition-colors"
            style={{
              background: "var(--accent)",
              color: "var(--bg)",
            }}
          >
            <ChefHat size={18} />
            Start Baking
          </Link>
        </div>

        {/* Divider */}
        <div className="px-6">
          <div style={{ borderBottom: "1px solid var(--border-subtle)" }} />
        </div>

        {/* Tabs */}
        <div className="px-6 pt-6 mb-6">
          <div
            className="flex gap-1 rounded-xl p-1 max-w-sm"
            style={{ background: "var(--bg-subtle)" }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2.5 text-xs font-medium rounded-lg transition-all duration-200"
                style={{
                  background:
                    activeTab === tab.id ? "var(--card)" : "transparent",
                  color:
                    activeTab === tab.id
                      ? "var(--text)"
                      : "var(--text-muted)",
                  boxShadow:
                    activeTab === tab.id ? "var(--shadow-card)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-12">
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
                  style={{ color: "var(--text-muted)" }}
                >
                  Scale
                </span>
                <div className="flex gap-1.5">
                  {[0.5, 1, 1.5, 2].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMultiplier(m)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background:
                          multiplier === m
                            ? "var(--accent)"
                            : "var(--bg-subtle)",
                        color:
                          multiplier === m
                            ? "var(--bg)"
                            : "var(--text-secondary)",
                        border:
                          multiplier === m
                            ? "none"
                            : "1px solid var(--border-subtle)",
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
                        style={{ color: "var(--text-muted)" }}
                      >
                        Timeline
                      </h3>
                      <div className="space-y-2.5">
                        {recipe.timeline.map((step, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-4 rounded-xl p-4"
                            style={{
                              background: "var(--card)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium mt-0.5 shrink-0"
                              style={{
                                background: "var(--bg-subtle)",
                                color: "var(--text-faint)",
                              }}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium"
                                style={{ color: "var(--text)" }}
                              >
                                {step.name}
                              </p>
                              <p
                                className="text-[11px] mt-0.5"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {step.duration}
                              </p>
                              <p
                                className="text-xs mt-1.5 leading-relaxed"
                                style={{ color: "var(--text-secondary)" }}
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
                        style={{ color: "var(--text-muted)" }}
                      >
                        Levain
                        {allCheckedInGroup("levain", recipe.ingredients.levain) && (
                          <span className="text-[10px] font-normal normal-case tracking-normal" style={{ color: "var(--accent)" }}>Ready!</span>
                        )}
                      </h3>
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border-subtle)",
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
                                  ? "1px solid var(--border-subtle)"
                                  : "none",
                              opacity: on ? 0.4 : 1,
                            }}
                          >
                            <span
                              className="text-sm"
                              style={{ color: "var(--text-secondary)", textDecoration: on ? "line-through" : "none" }}
                            >
                              {ing.name}
                            </span>
                            <div className="flex items-center gap-3">
                              {ing.bakerPercent && (
                                <span
                                  className="text-[10px] tracking-wide"
                                  style={{ color: "var(--text-ghost)" }}
                                >
                                  {ing.bakerPercent}
                                </span>
                              )}
                              <span
                                className="text-sm font-medium tabular-nums"
                                style={{ color: "var(--text)", textDecoration: on ? "line-through" : "none" }}
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
                      style={{ color: "var(--text-muted)" }}
                    >
                      Main Dough
                      {allCheckedInGroup("main", recipe.ingredients.main) && (
                        <span className="text-[10px] font-normal normal-case tracking-normal" style={{ color: "var(--accent)" }}>Ready!</span>
                      )}
                    </h3>
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border-subtle)",
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
                                ? "1px solid var(--border-subtle)"
                                : "none",
                            opacity: on ? 0.4 : 1,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <span
                              className="text-sm"
                              style={{ color: "var(--text-secondary)", textDecoration: on ? "line-through" : "none" }}
                            >
                              {ing.name}
                            </span>
                            {ing.note && (
                              <span
                                className="text-[10px] ml-2"
                                style={{ color: "var(--text-ghost)" }}
                              >
                                {ing.note}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {ing.bakerPercent && (
                              <span
                                className="text-[10px] tracking-wide"
                                style={{ color: "var(--text-ghost)" }}
                              >
                                {ing.bakerPercent}
                              </span>
                            )}
                            <span
                              className="text-sm font-medium tabular-nums"
                              style={{ color: "var(--text)", textDecoration: on ? "line-through" : "none" }}
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
                          style={{ color: "var(--text-muted)" }}
                        >
                          Additions
                          {allCheckedInGroup("additions", recipe.ingredients.additions) && (
                            <span className="text-[10px] font-normal normal-case tracking-normal" style={{ color: "var(--accent)" }}>Ready!</span>
                          )}
                        </h3>
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--border-subtle)",
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
                                    ? "1px solid var(--border-subtle)"
                                    : "none",
                                opacity: on ? 0.4 : 1,
                              }}
                            >
                              <span
                                className="text-sm"
                                style={{ color: "var(--text-secondary)", textDecoration: on ? "line-through" : "none" }}
                              >
                                {ing.name}
                              </span>
                              <span
                                className="text-sm font-medium tabular-nums"
                                style={{ color: "var(--text)", textDecoration: on ? "line-through" : "none" }}
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
                          style={{ color: "var(--text-muted)" }}
                        >
                          Filling
                          {allCheckedInGroup("filling", recipe.ingredients.filling) && (
                            <span className="text-[10px] font-normal normal-case tracking-normal" style={{ color: "var(--accent)" }}>Ready!</span>
                          )}
                        </h3>
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--border-subtle)",
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
                                    ? "1px solid var(--border-subtle)"
                                    : "none",
                                opacity: on ? 0.4 : 1,
                              }}
                            >
                              <span
                                className="text-sm"
                                style={{ color: "var(--text-secondary)", textDecoration: on ? "line-through" : "none" }}
                              >
                                {ing.name}
                              </span>
                              <span
                                className="text-sm font-medium tabular-nums"
                                style={{ color: "var(--text)", textDecoration: on ? "line-through" : "none" }}
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
                    style={{ color: "var(--text-muted)" }}
                  >
                    <History size={12} /> Your Bake History
                  </h3>
                  <div className="space-y-2.5 max-w-xl">
                    {pastBakes.map((bake) => (
                      <Link
                        key={bake.id}
                        href={`/journal/${bake.id}`}
                        className="flex items-center justify-between rounded-xl p-4 transition-colors"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {formatDistanceToNow(new Date(bake.started_at), {
                            addSuffix: true,
                          })}
                        </p>
                        <div className="flex items-center gap-2">
                          {bake.overall_rating && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--accent)" }}
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
                    background: "var(--card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
                      style={{
                        background: "var(--accent-surface)",
                        color: "var(--accent)",
                      }}
                    >
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h4
                        className="text-sm font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {step.title}
                      </h4>
                      {step.duration && (
                        <p
                          className="text-[11px] mt-1 flex items-center gap-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Clock size={10} /> {step.duration}
                        </p>
                      )}
                      <p
                        className="text-sm mt-2.5 leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {step.instructions}
                      </p>
                      {step.temperature && (
                        <p
                          className="text-xs mt-2.5 flex items-center gap-1"
                          style={{ color: "var(--accent)" }}
                        >
                          {step.temperature}
                        </p>
                      )}
                      {step.tip && (
                        <div
                          className="mt-3 rounded-lg p-3"
                          style={{
                            background: "var(--bg-subtle)",
                            transform: `rotate(${getTipRotation(`step-${step.step}`)}deg)`,
                          }}
                        >
                          <p
                            className="text-base flex items-start gap-2 leading-relaxed"
                            style={{
                              color: "var(--text-secondary)",
                              fontFamily: "var(--font-caveat)",
                            }}
                          >
                            <Lightbulb
                              size={12}
                              className="mt-1 shrink-0"
                              style={{ color: "var(--accent)" }}
                            />
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
                    background: "var(--card)",
                    border: "1px solid var(--border-subtle)",
                    transform: `rotate(${getTipRotation(`tip-${i}`)}deg)`,
                  }}
                >
                  <Lightbulb
                    size={16}
                    className="mt-1 shrink-0"
                    style={{ color: "var(--accent)" }}
                  />
                  <p
                    className="text-base leading-relaxed"
                    style={{
                      color: "var(--text-secondary)",
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
    </div>
  );
}
