"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChefHat,
  BookOpen,
  ArrowRight,
  Flame,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { supabase, type BakeSession } from "@/lib/supabase";
import { recipes, getRecipeById } from "@/data/recipes";
import { formatDistanceToNow } from "date-fns";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const BAKING_WISDOMS = [
  "Cold dough shapes easier.",
  "Trust the process. And the starter.",
  "The best bread is the one you actually bake.",
  "Flour, water, salt, time. That’s it.",
  "Your starter knows what it’s doing.",
  "Patience is the secret ingredient.",
  "Steam in the first ten minutes changes everything.",
  "A wet dough is a good dough.",
  "The fridge is your friend.",
  "Score with confidence, not caution.",
  "Good bread can’t be rushed.",
  "Listen to your dough. It tells you when it’s ready.",
  "Autolyse: the laziest step with the biggest payoff.",
  "Bulk fermentation is where the magic happens.",
  "Every oven lies. Get a thermometer.",
];

function getDailyWisdom(): string {
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % BAKING_WISDOMS.length;
  return BAKING_WISDOMS[dayIndex];
}

const FLOUR_PARTICLES = [
  { top: "15%", left: "8%", size: 3, anim: "flour-drift-1", dur: "18s" },
  { top: "25%", left: "85%", size: 2, anim: "flour-drift-2", dur: "22s" },
  { top: "40%", left: "20%", size: 4, anim: "flour-drift-3", dur: "25s" },
  { top: "10%", left: "60%", size: 2, anim: "flour-drift-4", dur: "20s" },
  { top: "55%", left: "75%", size: 3, anim: "flour-drift-5", dur: "28s" },
  { top: "35%", left: "45%", size: 2, anim: "flour-drift-6", dur: "16s" },
  { top: "60%", left: "30%", size: 3, anim: "flour-drift-7", dur: "24s" },
  { top: "20%", left: "92%", size: 4, anim: "flour-drift-8", dur: "30s" },
  { top: "50%", left: "12%", size: 2, anim: "flour-drift-9", dur: "19s" },
  { top: "45%", left: "55%", size: 3, anim: "flour-drift-10", dur: "27s" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 7) return "Still up? Let’s bake.";
  if (hour < 12) return "Rise and shine.";
  if (hour < 17) return "Afternoon proof.";
  return "Evening bake session.";
}

export default function HomePage() {
  const [recentBakes, setRecentBakes] = useState<BakeSession[]>([]);
  const [activeBake, setActiveBake] = useState<BakeSession | null>(null);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, avgRating: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: bakes } = await supabase
      .from("bake_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5);

    if (bakes) {
      setRecentBakes(bakes);
      const active = bakes.find((b) => b.status === "in-progress");
      if (active) setActiveBake(active);

      const { count } = await supabase
        .from("bake_sessions")
        .select("*", { count: "exact", head: true });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { count: monthCount } = await supabase
        .from("bake_sessions")
        .select("*", { count: "exact", head: true })
        .gte("started_at", monthStart.toISOString());

      const { data: rated } = await supabase
        .from("bake_sessions")
        .select("overall_rating")
        .not("overall_rating", "is", null);

      const avg =
        rated && rated.length > 0
          ? rated.reduce((sum, b) => sum + (b.overall_rating || 0), 0) /
            rated.length
          : 0;

      setStats({
        total: count || 0,
        thisMonth: monthCount || 0,
        avgRating: Math.round(avg * 10) / 10,
      });
    }
  }

  const suggested = recipes
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return (
    <div className="min-h-screen noise">
      <div className="max-w-6xl mx-auto">
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative px-6 pt-20 pb-12 lg:pt-16 lg:pb-14 overflow-hidden"
        >
          {/* Ambient glow orbs — visible in dark, transparent in light via --glow-color */}
          <div
            className="absolute -top-10 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{ background: "var(--glow-color)" }}
          />
          <div
            className="absolute bottom-0 -left-10 w-60 h-60 rounded-full blur-3xl pointer-events-none"
            style={{ background: "var(--glow-color)" }}
          />

          {/* Floating flour particles */}
          {FLOUR_PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                background: "var(--text-ghost)",
                opacity: 0.2,
                animation: `${p.anim} ${p.dur} ease-in-out infinite`,
                willChange: "transform",
              }}
            />
          ))}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <p
              className="text-[11px] font-medium tracking-[0.25em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Welcome back
            </p>
            <h1
              className="font-[family-name:var(--font-playfair)] text-5xl lg:text-6xl font-semibold tracking-tight mt-3 lg:hidden"
              style={{ color: "var(--text)" }}
            >
              Proof
            </h1>
            <h1
              className="hidden lg:block font-[family-name:var(--font-playfair)] text-5xl font-semibold tracking-tight mt-3"
              style={{ color: "var(--text)" }}
            >
              Dashboard
            </h1>
            <p
              className="text-sm mt-3 lg:text-base leading-relaxed max-w-sm"
              style={{ color: "var(--text-faint)" }}
            >
              {getGreeting()}
            </p>
            <p
              className="text-xs italic mt-2 max-w-xs"
              style={{ color: "var(--text-faint)" }}
            >
              {getDailyWisdom()}
            </p>
          </motion.div>
        </motion.div>

        {/* ── Active Bake Banner ── */}
        {activeBake && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-6 mb-8"
          >
            <Link
              href={`/bake/${activeBake.recipe_id}?session=${activeBake.id}`}
              className="block rounded-2xl p-5 glow-amber animate-shimmer transition-all duration-300"
              style={{
                background: "var(--accent-surface)",
                border: "1px solid var(--accent-dim)",
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-2 h-2 rounded-full animate-gentle-pulse"
                  style={{ background: "var(--accent)" }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "var(--accent)" }}
                >
                  Bake in progress
                </span>
              </div>
              <p
                className="font-medium text-base"
                style={{ color: "var(--text)" }}
              >
                {getRecipeById(activeBake.recipe_id)?.title || "Unknown Recipe"}
              </p>
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--text-faint)" }}
              >
                Started{" "}
                {formatDistanceToNow(new Date(activeBake.started_at), {
                  addSuffix: true,
                })}
              </p>
            </Link>
          </motion.div>
        )}

        {/* ── Stats + Quick Actions ── */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:px-6 lg:mb-10">
          {/* Stats */}
          <motion.div
            {...fadeIn}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="px-6 mb-8 lg:px-0 lg:mb-0"
          >
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              The Dough Report
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Flame, label: "Total Bakes", value: stats.total },
                { icon: Clock, label: "This Month", value: stats.thisMonth },
                {
                  icon: TrendingUp,
                  label: "Avg Rating",
                  value: stats.avgRating || "—",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4 card-glow transition-all duration-300"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <Icon
                    size={15}
                    className="mb-3 opacity-50"
                    style={{ color: "var(--accent)" }}
                  />
                  <p
                    className="text-2xl font-semibold tabular-nums tracking-tight"
                    style={{ color: "var(--text)" }}
                  >
                    {value}
                  </p>
                  <p
                    className="text-[10px] mt-1 uppercase tracking-wider font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            {...fadeIn}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="px-6 mb-10 lg:px-0 lg:mb-0"
          >
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              What&apos;s baking?
            </h2>
            <div className="grid grid-cols-2 gap-3 h-[calc(100%-2rem)]">
              <Link
                href="/recipes"
                className="group flex flex-col justify-between rounded-2xl p-5 card-glow transition-all duration-300"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "var(--accent-surface)" }}
                >
                  <BookOpen size={18} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    Browse
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {recipes.length} recipes
                  </p>
                </div>
              </Link>
              <Link
                href="/bake"
                className="group flex flex-col justify-between rounded-2xl p-5 card-glow transition-all duration-300"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "var(--accent-surface)" }}
                >
                  <ChefHat size={18} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    Start Bake
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--text-faint)" }}
                  >
                    New session
                  </p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ── Divider ── */}
        <div className="mx-6 mb-10 lg:mb-12" style={{ borderTop: "1px solid var(--border-subtle)" }} />

        {/* ── Recent Bakes + Suggested Recipes ── */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:px-6 lg:pb-12">
          {/* Recent Bakes */}
          {recentBakes.length > 0 && (
            <motion.div
              {...fadeIn}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="px-6 mb-10 lg:px-0 lg:mb-0"
            >
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Recent Bakes
                </h2>
                <Link
                  href="/journal"
                  className="text-xs flex items-center gap-1.5 transition-colors duration-200"
                  style={{ color: "var(--accent)" }}
                >
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-2">
                {recentBakes.slice(0, 3).map((bake) => {
                  const recipe = getRecipeById(bake.recipe_id);
                  return (
                    <Link
                      key={bake.id}
                      href={`/journal/${bake.id}`}
                      className="flex items-center justify-between rounded-xl p-4 card-glow transition-all duration-300"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border-subtle)",
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm truncate"
                          style={{ color: "var(--text)" }}
                        >
                          {recipe?.title || bake.recipe_id}
                        </p>
                        <p
                          className="text-[11px] mt-1"
                          style={{ color: "var(--text-faint)" }}
                        >
                          {formatDistanceToNow(new Date(bake.started_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {bake.overall_rating && (
                        <div
                          className="flex items-center gap-1 ml-3"
                          style={{ color: "var(--accent)" }}
                        >
                          <span className="text-sm font-medium tabular-nums">
                            {bake.overall_rating}
                          </span>
                          <span className="text-[10px]">{"★"}</span>
                        </div>
                      )}
                      {bake.status === "in-progress" && (
                        <div
                          className="w-2 h-2 rounded-full animate-gentle-pulse ml-3"
                          style={{ background: "var(--accent)" }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Suggested Recipes */}
          <motion.div
            {...fadeIn}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="px-6 pb-10 lg:px-0 lg:pb-0"
          >
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-5 flex items-center gap-2"
              style={{ color: "var(--text-muted)" }}
            >
              <Sparkles size={11} style={{ color: "var(--accent)", opacity: 0.5 }} />
              Try Something New
            </h2>
            <div className="space-y-2">
              {suggested.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="group flex items-center gap-4 rounded-xl p-4 card-glow transition-all duration-300"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm truncate transition-colors duration-200"
                      style={{ color: "var(--text)" }}
                    >
                      {recipe.title}
                    </p>
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {recipe.totalTime} &middot; {recipe.difficulty}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="shrink-0 transition-colors duration-200"
                    style={{ color: "var(--text-ghost)" }}
                  />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
