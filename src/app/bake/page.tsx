"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/illustrations/icons";
import { BakeRow } from "@/components/ui/bake-row";
import { Chip } from "@/components/ui/chip";
import { supabase, type BakeSession } from "@/lib/supabase";
import { recipes, getRecipeById } from "@/data/recipes";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function BakePage() {
  const [activeBakes, setActiveBakes] = useState<BakeSession[]>([]);

  useEffect(() => {
    supabase
      .from("bake_sessions")
      .select("*")
      .eq("status", "in-progress")
      .order("started_at", { ascending: false })
      .then(({ data }) => {
        if (data) setActiveBakes(data);
      });
  }, []);

  const categories = [
    { id: "tutorial", label: "Start Here", emoji: "\u{1F4D6}" },
    { id: "free-form-loaves", label: "Free-Form Loaves", emoji: "\u{1F35E}" },
    { id: "pan-loaves", label: "Pan Loaves", emoji: "\u{1F35E}" },
    { id: "pizzas-flatbreads", label: "Pizza & Flatbreads", emoji: "\u{1F355}" },
    { id: "buns-rolls-more", label: "Rolls & More", emoji: "\u{1F950}" },
    { id: "sweets", label: "Sweets", emoji: "\u{1F9C1}" },
  ];

  return (
    <div className="anim-rise proof-page min-h-screen">
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Start a Bake" subtitle="Pick your adventure" scriptTag="flour is patient. you don't have to be." />

        {/* Active Bakes */}
        {activeBakes.length > 0 && (
          <div className="px-5 mb-6">
            <h2 className="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--crust)" }}>
              <div className="w-2 h-2 rounded-full animate-gentle-pulse" style={{ background: "var(--crust)" }} />
              In Progress
            </h2>
            <div className="space-y-2 max-w-xl">
              {activeBakes.map((bake) => {
                const recipe = getRecipeById(bake.recipe_id);
                return (
                  <Link
                    key={bake.id}
                    href={`/bake/${bake.recipe_id}?session=${bake.id}`}
                    className="flex items-center justify-between rounded-xl p-3.5 transition-colors"
                    style={{ background: "rgba(232,155,60,0.12)", border: "1px solid rgba(232,155,60,0.12)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                        {recipe?.title || bake.recipe_id}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-mute)" }}>
                        Started{" "}
                        {formatDistanceToNow(new Date(bake.started_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Icon.arrow width={14} height={14} style={{ color: "var(--crust)" }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recipe Categories */}
        <div className="px-5 pb-8">
          {categories.map((cat) => {
            const catRecipes = recipes.filter((r) => r.category === cat.id);
            if (catRecipes.length === 0) return null;

            return (
              <div key={cat.id} className="mb-8">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                  <div className="display" style={{ fontSize: 28, whiteSpace: 'nowrap' }}>{cat.label}</div>
                  <span style={{ color: 'var(--ink-mute)', fontSize: 14 }}>({catRecipes.length})</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', marginLeft: 12 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {catRecipes.map((recipe) => (
                    <BakeRow key={recipe.id} recipe={recipe} href={`/bake/${recipe.id}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
