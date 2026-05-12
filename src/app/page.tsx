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
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative px-5 pt-16 pb-8 lg:pt-12 overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-600/3 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <p className="text-stone-600 text-xs font-medium tracking-[0.2em] uppercase">
              Welcome back
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-5xl lg:text-6xl font-semibold tracking-tight text-stone-100 mt-2 lg:hidden">
              Proof
            </h1>
            <h1 className="hidden lg:block font-[family-name:var(--font-playfair)] text-5xl font-semibold tracking-tight text-stone-100 mt-2">
              Dashboard
            </h1>
            <p className="text-stone-500 text-sm mt-2 lg:text-base">
              Your sourdough companion
            </p>
          </motion.div>
        </motion.div>

        {/* Active Bake Banner */}
        {activeBake && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-5 mb-6"
          >
            <Link
              href={`/bake/${activeBake.recipe_id}?session=${activeBake.id}`}
              className="block bg-gradient-to-br from-amber-900/20 to-amber-950/10 border border-amber-800/30 rounded-2xl p-4 hover:border-amber-700/40 transition-all duration-300 glow-amber animate-shimmer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-gentle-pulse" />
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-[0.15em]">
                  Bake in progress
                </span>
              </div>
              <p className="text-stone-200 font-medium">
                {getRecipeById(activeBake.recipe_id)?.title || "Unknown Recipe"}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Started{" "}
                {formatDistanceToNow(new Date(activeBake.started_at), {
                  addSuffix: true,
                })}
              </p>
            </Link>
          </motion.div>
        )}

        {/* Stats + Quick Actions row on desktop */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:px-5 lg:mb-8">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-5 mb-6 lg:px-0 lg:mb-0"
          >
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Flame, label: "Total Bakes", value: stats.total, accent: "text-orange-400" },
                { icon: Clock, label: "This Month", value: stats.thisMonth, accent: "text-amber-400" },
                {
                  icon: TrendingUp,
                  label: "Avg Rating",
                  value: stats.avgRating || "—",
                  accent: "text-emerald-400",
                },
              ].map(({ icon: Icon, label, value, accent }) => (
                <div
                  key={label}
                  className="bg-gradient-to-b from-stone-900 to-stone-900/50 rounded-2xl p-3.5 border border-stone-800/50 card-glow"
                >
                  <Icon size={16} className={`${accent} opacity-60 mb-2`} />
                  <p className="text-2xl font-semibold text-stone-200 tabular-nums tracking-tight">
                    {value}
                  </p>
                  <p className="text-[10px] text-stone-600 mt-0.5 uppercase tracking-wider font-medium">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-5 mb-8 lg:px-0 lg:mb-0"
          >
            <div className="grid grid-cols-2 gap-3 h-full">
              <Link
                href="/recipes"
                className="group flex items-center gap-3 bg-stone-900 rounded-2xl p-4 border border-stone-800/50 active:bg-stone-800 hover:border-stone-700/60 transition-all duration-300 card-glow"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-900/40 to-amber-950/20 flex items-center justify-center group-hover:from-amber-900/50 transition-all">
                  <BookOpen size={18} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-200">Browse</p>
                  <p className="text-[11px] text-stone-500">
                    {recipes.length} recipes
                  </p>
                </div>
              </Link>
              <Link
                href="/bake"
                className="group flex items-center gap-3 bg-stone-900 rounded-2xl p-4 border border-stone-800/50 active:bg-stone-800 hover:border-stone-700/60 transition-all duration-300 card-glow"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-900/40 to-emerald-950/20 flex items-center justify-center group-hover:from-emerald-900/50 transition-all">
                  <ChefHat size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-200">Start Bake</p>
                  <p className="text-[11px] text-stone-500">New session</p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Recent + Suggested side by side on desktop */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:px-5 lg:pb-8">
          {/* Recent Bakes */}
          {recentBakes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="px-5 mb-8 lg:px-0 lg:mb-0"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-[0.12em]">
                  Recent Bakes
                </h2>
                <Link
                  href="/journal"
                  className="text-xs text-amber-500 flex items-center gap-1 hover:text-amber-400 transition-colors"
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
                      className="flex items-center justify-between bg-stone-900 rounded-xl p-3.5 border border-stone-800/50 active:bg-stone-800 hover:border-stone-700/60 transition-all duration-300 card-glow"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-200 truncate">
                          {recipe?.title || bake.recipe_id}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {formatDistanceToNow(new Date(bake.started_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {bake.overall_rating && (
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <span className="text-sm font-medium tabular-nums">
                            {bake.overall_rating}
                          </span>
                          <span className="text-[10px]">★</span>
                        </div>
                      )}
                      {bake.status === "in-progress" && (
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-gentle-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Suggested Recipes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="px-5 pb-8 lg:px-0 lg:pb-0"
          >
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500/50" />
              Try Something New
            </h2>
            <div className="space-y-2">
              {suggested.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="group flex items-center gap-3 bg-stone-900 rounded-xl p-3.5 border border-stone-800/50 active:bg-stone-800 hover:border-stone-700/60 transition-all duration-300 card-glow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-200 truncate group-hover:text-amber-50 transition-colors">
                      {recipe.title}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {recipe.totalTime} · {recipe.difficulty}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-stone-700 group-hover:text-amber-500/50 transition-colors" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
