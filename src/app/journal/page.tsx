"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, type BakeSession } from "@/lib/supabase";
import { getRecipeById } from "@/data/recipes";
import { PageHeader } from "@/components/ui/page-header";
import { Chip } from "@/components/ui/chip";
import { Pill } from "@/components/ui/pill";
import { Icon } from "@/components/illustrations/icons";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";
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
    <div className="anim-rise proof-page">
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Journal" subtitle="Every loaf tells a story." />

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, paddingLeft: 20, paddingRight: 20 }}>
          {(["all", "completed", "in-progress"] as const).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "completed" ? "Completed" : "In Progress"}
            </Chip>
          ))}
        </div>

        {/* Bakes List */}
        <div className="px-5 pb-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--crust)" }} />
            </div>
          ) : bakes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div className="anim-float" style={{ opacity: 0.4, marginBottom: 18 }}>
                <BreadIllustration seed="empty-journal" size={140} />
              </div>
              <div className="display" style={{ fontSize: 30, fontStyle: 'italic', marginBottom: 6 }}>A blank page.</div>
              <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-mute)', marginBottom: 4 }}>your first loaf is calling.</div>
            </div>
          ) : (
            Object.entries(grouped).map(([month, monthBakes]) => (
              <div key={month} className="mb-8">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Icon.calendar width={13} height={13} style={{ color: 'var(--ink-mute)' }} />
                  <span className="label" style={{ whiteSpace: 'nowrap' }}>{month}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', marginLeft: 6 }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {monthBakes.map((bake) => {
                    const recipe = getRecipeById(bake.recipe_id);
                    return (
                      <Link
                        key={bake.id}
                        href={`/journal/${bake.id}`}
                        className="block"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: 18,
                          display: 'grid',
                          gridTemplateColumns: '60px 1fr auto auto',
                          gap: 16,
                          alignItems: 'center',
                          transition: 'transform 0.2s var(--ease-bounce), border-color 0.2s',
                        }}>
                          <div style={{
                            width: 60, height: 60, borderRadius: 12,
                            background: 'var(--surface-3)',
                            display: 'grid', placeItems: 'center',
                          }}>
                            <BreadIllustration seed={bake.recipe_id} size={48} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{recipe?.title || bake.recipe_id}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                              {format(new Date(bake.started_at), "EEE, MMM d · h:mm a")}
                            </div>
                            {bake.overall_notes && (
                              <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', marginTop: 4 }}>
                                &quot;{bake.overall_notes}&quot;
                              </div>
                            )}
                          </div>
                          <div>
                            {bake.overall_rating && (
                              <div style={{ display: 'flex', gap: 2 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} style={{ fontSize: 13, color: star <= bake.overall_rating! ? 'var(--crust)' : 'var(--ink-faint)' }}>★</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Pill tone={bake.status === "completed" ? "beginner" : "intermediate"}>
                            {bake.status === "completed" ? "✓ done" : "◐ in progress"}
                          </Pill>
                        </div>
                      </Link>
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
