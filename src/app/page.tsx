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
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="px-5 pt-16 pb-6"
      >
        <p className="text-stone-500 text-sm font-medium tracking-wide uppercase">
          Welcome back
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold tracking-tight text-stone-100 mt-1">
          Proof
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Your sourdough companion
        </p>
      </motion.div>

      {/* Active Bake Banner */}
      {activeBake && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-5 mb-5"
        >
          <Link
            href={`/bake/${activeBake.recipe_id}?session=${activeBake.id}`}
            className="block bg-amber-900/20 border border-amber-800/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-gentle-pulse" />
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
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

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-5 mb-6"
      >
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
              className="bg-stone-900 rounded-2xl p-3.5 border border-stone-800/50"
            >
              <Icon size={16} className="text-stone-600 mb-2" />
              <p className="text-xl font-semibold text-stone-200 tabular-nums">
                {value}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5 uppercase tracking-wider">
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
        transition={{ delay: 0.25 }}
        className="px-5 mb-8"
      >
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/recipes"
            className="flex items-center gap-3 bg-stone-900 rounded-2xl p-4 border border-stone-800/50 active:bg-stone-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-900/30 flex items-center justify-center">
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
            className="flex items-center gap-3 bg-stone-900 rounded-2xl p-4 border border-stone-800/50 active:bg-stone-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-900/30 flex items-center justify-center">
              <ChefHat size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-200">Start Bake</p>
              <p className="text-[11px] text-stone-500">New session</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Recent Bakes */}
      {recentBakes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="px-5 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wider">
              Recent Bakes
            </h2>
            <Link
              href="/journal"
              className="text-xs text-amber-500 flex items-center gap-1"
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
                  className="flex items-center justify-between bg-stone-900 rounded-xl p-3.5 border border-stone-800/50 active:bg-stone-800 transition-colors"
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
                      <span className="text-sm font-medium">
                        {bake.overall_rating}
                      </span>
                      <span className="text-[10px]">{"★"}</span>
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
        transition={{ delay: 0.45 }}
        className="px-5 pb-8"
      >
        <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wider mb-3">
          Try Something New
        </h2>
        <div className="space-y-2">
          {suggested.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="flex items-center gap-3 bg-stone-900 rounded-xl p-3.5 border border-stone-800/50 active:bg-stone-800 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-200 truncate">
                  {recipe.title}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {recipe.totalTime} · {recipe.difficulty}
                </p>
              </div>
              <ArrowRight size={14} className="text-stone-600" />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
