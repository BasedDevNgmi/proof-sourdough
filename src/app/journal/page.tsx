"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { supabase, type BakeSession } from "@/lib/supabase";
import { getRecipeById } from "@/data/recipes";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function JournalPage() {
  const [bakes, setBakes] = useState<BakeSession[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "in-progress">(
    "all"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBakes();
  }, [filter]);

  async function loadBakes() {
    setLoading(true);
    let query = supabase
      .from("bake_sessions")
      .select("*")
      .order("started_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setBakes(data || []);
    setLoading(false);
  }

  const grouped = bakes.reduce<Record<string, BakeSession[]>>((acc, bake) => {
    const month = format(new Date(bake.started_at), "MMMM yyyy");
    if (!acc[month]) acc[month] = [];
    acc[month].push(bake);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Journal" subtitle="Every loaf tells a story" />

        {/* Filter */}
        <div className="px-5 mb-5 flex gap-2">
          {(["all", "completed", "in-progress"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: filter === f ? "var(--accent)" : "var(--accent-surface)",
                color: filter === f ? "var(--bg)" : "var(--text-muted)",
              }}
            >
              {f === "all" ? "All" : f === "completed" ? "Completed" : "In Progress"}
            </button>
          ))}
        </div>

        {/* Bakes List */}
        <div className="px-5 pb-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
            </div>
          ) : bakes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-3 w-fit"
              >
                <Calendar size={32} style={{ color: "var(--text-ghost)" }} />
              </motion.div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Your journal is as empty as a bread basket before dinner</p>
              <Link
                href="/bake"
                className="text-sm mt-2 inline-block"
                style={{ color: "var(--accent)" }}
              >
                Bake your first story
              </Link>
            </motion.div>
          ) : (
            Object.entries(grouped).map(([month, monthBakes]) => (
              <div key={month} className="mb-8">
                <h3 className="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}>
                  <Calendar size={11} />
                  {month}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {monthBakes.map((bake, i) => {
                    const recipe = getRecipeById(bake.recipe_id);
                    return (
                      <motion.div
                        key={bake.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Link
                          href={`/journal/${bake.id}`}
                          className="block rounded-xl p-4 transition-all duration-200 card-glow"
                          style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                                {recipe?.title || bake.recipe_id}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                                {format(
                                  new Date(bake.started_at),
                                  "EEE, MMM d · h:mm a"
                                )}
                              </p>
                              {bake.overall_notes && (
                                <p className="text-xs mt-1.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>
                                  {bake.overall_notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                              <Badge
                                variant={
                                  bake.status === "completed"
                                    ? "emerald"
                                    : bake.status === "in-progress"
                                    ? "amber"
                                    : "rose"
                                }
                              >
                                {bake.status}
                              </Badge>
                              {bake.overall_rating && (
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className="text-[10px]"
                                      style={{ color: star <= bake.overall_rating! ? "var(--accent)" : "var(--text-ghost)" }}
                                    >
                                      &#9733;
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {(bake.flour_brand || bake.ambient_temp_f) && (
                            <div className="flex gap-3 mt-2 text-[10px]" style={{ color: "var(--text-faint)" }}>
                              {bake.flour_brand && (
                                <span>Flour: {bake.flour_brand}</span>
                              )}
                              {bake.ambient_temp_f && (
                                <span>{bake.ambient_temp_f}°C</span>
                              )}
                            </div>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
