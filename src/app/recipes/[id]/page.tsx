"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { getRecipeById } from "@/data/recipes";
import { supabase, type BakeSession } from "@/lib/supabase";
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

  useEffect(() => {
    if (!recipe) return;
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
        <p className="text-stone-500">Recipe not found</p>
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-stone-500 text-sm mb-4 active:text-stone-300 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Badge variant={difficultyVariant[recipe.difficulty]}>
            {recipe.difficulty}
          </Badge>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-tight text-stone-100 mt-2">
            {recipe.title}
          </h1>
          {recipe.subtitle && (
            <p className="text-sm text-stone-500 mt-1">{recipe.subtitle}</p>
          )}
          <p className="text-sm text-stone-400 mt-3 leading-relaxed">
            {recipe.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Clock size={13} /> {recipe.totalTime}
            </span>
            <span className="flex items-center gap-1">
              <Timer size={13} /> {recipe.activeTime} active
            </span>
            {recipe.hydration && (
              <span className="flex items-center gap-1">
                <Droplets size={13} /> {recipe.hydration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Scale size={13} /> {recipe.yield}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-stone-600 bg-stone-800/50 px-2 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Start Bake CTA */}
      <div className="px-5 py-4">
        <Link
          href={`/bake/${recipe.id}`}
          className="flex items-center justify-center gap-2 w-full bg-amber-500 text-stone-950 font-semibold text-sm py-3 rounded-xl active:bg-amber-600 transition-colors"
        >
          <ChefHat size={18} />
          Start Baking
        </Link>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 bg-stone-900 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-stone-800 text-stone-200"
                  : "text-stone-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-5 pb-8">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {/* Scale Selector */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-stone-500">Scale:</span>
              {[0.5, 1, 1.5, 2].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMultiplier(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    multiplier === m
                      ? "bg-amber-500 text-stone-950"
                      : "bg-stone-800 text-stone-400"
                  }`}
                >
                  {m}x
                </button>
              ))}
            </div>

            {/* Timeline */}
            {recipe.timeline.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                  Timeline
                </h3>
                <div className="space-y-2">
                  {recipe.timeline.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-stone-900 rounded-xl p-3 border border-stone-800/50"
                    >
                      <div className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center text-[10px] text-stone-500 font-medium mt-0.5 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-200 font-medium">
                          {step.name}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {step.duration}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Levain Ingredients */}
            {recipe.ingredients.levain && recipe.ingredients.levain.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                  Levain
                </h3>
                <div className="bg-stone-900 rounded-xl border border-stone-800/50 divide-y divide-stone-800/50">
                  {recipe.ingredients.levain.map((ing, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3.5 py-2.5"
                    >
                      <span className="text-sm text-stone-300">{ing.name}</span>
                      <div className="flex items-center gap-2">
                        {ing.bakerPercent && (
                          <span className="text-[10px] text-stone-600">
                            {ing.bakerPercent}
                          </span>
                        )}
                        <span className="text-sm text-stone-200 font-medium tabular-nums">
                          {scaleWeight(ing.weight)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Ingredients */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                Main Dough
              </h3>
              <div className="bg-stone-900 rounded-xl border border-stone-800/50 divide-y divide-stone-800/50">
                {recipe.ingredients.main.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3.5 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-stone-300">{ing.name}</span>
                      {ing.note && (
                        <span className="text-[10px] text-stone-600 ml-1.5">
                          {ing.note}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ing.bakerPercent && (
                        <span className="text-[10px] text-stone-600">
                          {ing.bakerPercent}
                        </span>
                      )}
                      <span className="text-sm text-stone-200 font-medium tabular-nums">
                        {scaleWeight(ing.weight)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additions */}
            {recipe.ingredients.additions &&
              recipe.ingredients.additions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                    Additions
                  </h3>
                  <div className="bg-stone-900 rounded-xl border border-stone-800/50 divide-y divide-stone-800/50">
                    {recipe.ingredients.additions.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3.5 py-2.5"
                      >
                        <span className="text-sm text-stone-300">
                          {ing.name}
                        </span>
                        <span className="text-sm text-stone-200 font-medium tabular-nums">
                          {scaleWeight(ing.weight)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Filling */}
            {recipe.ingredients.filling &&
              recipe.ingredients.filling.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                    Filling
                  </h3>
                  <div className="bg-stone-900 rounded-xl border border-stone-800/50 divide-y divide-stone-800/50">
                    {recipe.ingredients.filling.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3.5 py-2.5"
                      >
                        <span className="text-sm text-stone-300">
                          {ing.name}
                        </span>
                        <span className="text-sm text-stone-200 font-medium tabular-nums">
                          {scaleWeight(ing.weight)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Past Bakes */}
            {pastBakes.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History size={12} /> Your Bake History
                </h3>
                <div className="space-y-2">
                  {pastBakes.map((bake) => (
                    <Link
                      key={bake.id}
                      href={`/journal/${bake.id}`}
                      className="flex items-center justify-between bg-stone-900 rounded-xl p-3 border border-stone-800/50"
                    >
                      <p className="text-xs text-stone-400">
                        {formatDistanceToNow(new Date(bake.started_at), {
                          addSuffix: true,
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        {bake.overall_rating && (
                          <span className="text-xs text-amber-500">
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
            className="space-y-3"
          >
            {recipe.steps.map((step) => (
              <div
                key={step.step}
                className="bg-stone-900 rounded-xl p-4 border border-stone-800/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-900/30 flex items-center justify-center text-xs text-amber-500 font-semibold shrink-0 mt-0.5">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-stone-200">
                      {step.title}
                    </h4>
                    {step.duration && (
                      <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {step.duration}
                      </p>
                    )}
                    <p className="text-sm text-stone-400 mt-2 leading-relaxed">
                      {step.instructions}
                    </p>
                    {step.temperature && (
                      <p className="text-xs text-amber-500/80 mt-2 flex items-center gap-1">
                        🌡️ {step.temperature}
                      </p>
                    )}
                    {step.tip && (
                      <div className="mt-2 bg-stone-800/50 rounded-lg p-2.5">
                        <p className="text-xs text-stone-400 flex items-start gap-1.5">
                          <Lightbulb
                            size={12}
                            className="text-amber-500 mt-0.5 shrink-0"
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
            className="space-y-3"
          >
            {recipe.tips.map((tip, i) => (
              <div
                key={i}
                className="bg-stone-900 rounded-xl p-4 border border-stone-800/50 flex items-start gap-3"
              >
                <Lightbulb
                  size={16}
                  className="text-amber-500 mt-0.5 shrink-0"
                />
                <p className="text-sm text-stone-300 leading-relaxed">{tip}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
