"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, type BakeSession } from "@/lib/supabase";
import { recipes, getRecipeById } from "@/data/recipes";
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
    { id: "tutorial", label: "Start Here" },
    { id: "free-form-loaves", label: "Free-Form Loaves" },
    { id: "pan-loaves", label: "Pan Loaves" },
    { id: "pizzas-flatbreads", label: "Pizza & Flatbreads" },
    { id: "buns-rolls-more", label: "Rolls & More" },
    { id: "sweets", label: "Sweets" },
  ];

  return (
    <div className="anim-rise proof-page" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          &sect; Bake &middot; Pick your adventure
        </div>
        <h1
          className="display"
          style={{
            fontSize: 'clamp(48px, 8vw, 120px)',
            fontWeight: 300,
            margin: 0,
            marginBottom: 10,
            lineHeight: 1.02,
          }}
        >
          Start a{' '}
          <span className="italic">Bake</span>
        </h1>
        <p
          style={{
            fontFamily: 'var(--serif-body)',
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'var(--ink-2)',
            maxWidth: 480,
            lineHeight: 1.55,
            marginBottom: 48,
          }}
        >
          Choose a formula, follow the steps, and log every detail along the way.
        </p>

        {/* Active Bakes */}
        {activeBakes.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div
                className="animate-gentle-pulse"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  flexShrink: 0,
                }}
              />
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>In Progress</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activeBakes.map((bake) => {
                const recipe = getRecipeById(bake.recipe_id);
                return (
                  <Link
                    key={bake.id}
                    href={`/bake/${bake.recipe_id}?session=${bake.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 0',
                      borderBottom: '.5px solid var(--hairline)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'padding-left .2s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.paddingLeft = '8px'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.paddingLeft = '0'; }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: 'var(--serif-display)',
                          fontSize: 18,
                          fontWeight: 400,
                          color: 'var(--ink)',
                          margin: 0,
                        }}
                      >
                        {recipe?.title || bake.recipe_id}
                      </p>
                      <p
                        className="italic"
                        style={{
                          fontSize: 13,
                          color: 'var(--muted)',
                          margin: 0,
                          marginTop: 2,
                        }}
                      >
                        Started{" "}
                        {formatDistanceToNow(new Date(bake.started_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 6l6 6-6 6" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Recipe Categories */}
        <div style={{ paddingBottom: 64 }}>
          {categories.map((cat, catIdx) => {
            const catRecipes = recipes.filter((r) => r.category === cat.id);
            if (catRecipes.length === 0) return null;

            return (
              <section key={cat.id} style={{ marginBottom: 48 }}>
                {/* Category eyebrow + hairline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <span className="eyebrow" style={{ whiteSpace: 'nowrap' }}>
                    &sect; {catIdx + 1} &middot; {cat.label}
                  </span>
                  <div style={{ flex: 1, height: '.5px', background: 'var(--hairline)' }} />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {catRecipes.length}
                  </span>
                </div>

                {/* Recipe grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 0,
                  }}
                >
                  {catRecipes.map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/bake/${recipe.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '14px 12px 14px 0',
                        borderBottom: '.5px solid var(--hairline)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'padding-left .2s ease, border-color .2s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.paddingLeft = '8px';
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.paddingLeft = '0';
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--hairline)';
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'var(--serif-display)',
                            fontSize: 17,
                            fontWeight: 400,
                            color: 'var(--ink)',
                            marginBottom: 3,
                          }}
                        >
                          {recipe.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.06em' }}>
                            {recipe.category.replace(/-/g, ' ').toUpperCase()}
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 999,
                              border: '.5px solid var(--hairline)',
                              fontFamily: 'var(--mono)',
                              fontSize: 9,
                              letterSpacing: '.06em',
                              textTransform: 'uppercase',
                              color: recipe.difficulty === 'beginner'
                                ? 'var(--sage)'
                                : recipe.difficulty === 'intermediate'
                                ? 'var(--accent)'
                                : 'var(--rose)',
                            }}
                          >
                            {recipe.difficulty}
                          </span>
                          <span className="mono" style={{ fontSize: 10, color: 'var(--muted-2)' }}>
                            {recipe.totalTime}
                          </span>
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M10 6l6 6-6 6" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
