"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Filter } from "lucide-react";
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
      <PageHeader title="Journal" subtitle="Your baking history" />

      {/* Filter */}
      <div className="px-5 mb-5 flex gap-2">
        {(["all", "completed", "in-progress"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? "bg-amber-500 text-stone-950"
                : "bg-stone-800/50 text-stone-400 active:bg-stone-700"
            }`}
          >
            {f === "all" ? "All" : f === "completed" ? "Completed" : "In Progress"}
          </button>
        ))}
      </div>

      {/* Bakes List */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : bakes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Calendar size={32} className="text-stone-700 mx-auto mb-3" />
            <p className="text-stone-500 text-sm">No bakes yet</p>
            <Link
              href="/bake"
              className="text-amber-500 text-sm mt-2 inline-block"
            >
              Start your first bake
            </Link>
          </motion.div>
        ) : (
          Object.entries(grouped).map(([month, monthBakes]) => (
            <div key={month} className="mb-6">
              <h3 className="text-xs font-medium text-stone-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar size={11} />
                {month}
              </h3>
              <div className="space-y-2">
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
                        className="block bg-stone-900 rounded-xl p-4 border border-stone-800/50 active:bg-stone-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-200 truncate">
                              {recipe?.title || bake.recipe_id}
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {format(
                                new Date(bake.started_at),
                                "EEE, MMM d · h:mm a"
                              )}
                            </p>
                            {bake.overall_notes && (
                              <p className="text-xs text-stone-400 mt-1.5 line-clamp-1">
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
                                    className={`text-[10px] ${
                                      star <= bake.overall_rating!
                                        ? "text-amber-500"
                                        : "text-stone-700"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick stats */}
                        {(bake.flour_brand || bake.ambient_temp_f) && (
                          <div className="flex gap-3 mt-2 text-[10px] text-stone-600">
                            {bake.flour_brand && (
                              <span>Flour: {bake.flour_brand}</span>
                            )}
                            {bake.ambient_temp_f && (
                              <span>{bake.ambient_temp_f}°F</span>
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
  );
}
