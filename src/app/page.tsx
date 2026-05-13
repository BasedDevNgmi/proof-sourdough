"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, type BakeSession } from "@/lib/supabase";
import { recipes, getRecipeById, books } from "@/data/recipes";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

const BAKING_WISDOMS = [
  "Cold dough shapes easier.",
  "Trust the process. And the starter.",
  "The best bread is the one you actually bake.",
  "Flour, water, salt, time. That's it.",
  "Your starter knows what it's doing.",
  "Patience is the secret ingredient.",
  "Steam in the first ten minutes changes everything.",
  "A wet dough is a good dough.",
  "The fridge is your friend.",
  "Score with confidence, not caution.",
  "Good bread can't be rushed.",
  "Listen to your dough. It tells you when it's ready.",
  "Autolyse: the laziest step with the biggest payoff.",
  "Bulk fermentation is where the magic happens.",
  "Every oven lies. Get a thermometer.",
];

function getDailyWisdom(): string {
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % BAKING_WISDOMS.length;
  return BAKING_WISDOMS[dayIndex];
}

function getGreeting(): { label: string; sub: string } {
  const hour = new Date().getHours();
  if (hour < 5) return { label: "Late-Night Bake", sub: "Still up? Let's bake." };
  if (hour < 12) return { label: "Morning Bake Session", sub: "Rise and shine." };
  if (hour < 17) return { label: "Afternoon Bake Session", sub: "Afternoon proof." };
  return { label: "Evening Bake Session", sub: "Evening bake session." };
}

function getWeeklyRecipe() {
  const now = new Date();
  const weekIndex = Math.floor((now.getFullYear() * 52 + Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)))) % recipes.length;
  return recipes[weekIndex];
}

function getMonthName(): string {
  return new Date().toLocaleString("en-US", { month: "long" });
}

export default function HomePage() {
  const router = useRouter();
  const [recentBakes, setRecentBakes] = useState<BakeSession[]>([]);
  const [activeBake, setActiveBake] = useState<BakeSession | null>(null);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, avgRating: 0, avgHydration: 0 });

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

      // Calculate average hydration from recipes of completed bakes
      const { data: allBakes } = await supabase
        .from("bake_sessions")
        .select("recipe_id")
        .eq("status", "completed");

      let avgHyd = 0;
      if (allBakes && allBakes.length > 0) {
        const hydrations = allBakes
          .map((b) => {
            const r = getRecipeById(b.recipe_id);
            return r?.hydration ? parseInt(r.hydration) : null;
          })
          .filter((h): h is number => h !== null);
        if (hydrations.length > 0) {
          avgHyd = Math.round(hydrations.reduce((a, b) => a + b, 0) / hydrations.length);
        }
      }

      setStats({
        total: count || 0,
        thisMonth: monthCount || 0,
        avgRating: Math.round(avg * 10) / 10,
        avgHydration: avgHyd,
      });
    }
  }

  const greeting = useMemo(() => getGreeting(), []);
  const featured = useMemo(() => getWeeklyRecipe(), []);
  const featuredBook = books.find((b) => b.id === featured.bookId);
  const wisdom = useMemo(() => getDailyWisdom(), []);

  // Split wisdom for editorial hero display
  const wisdomParts = wisdom.includes(".")
    ? [wisdom]
    : [wisdom];

  return (
    <div className="anim-rise proof-page" style={{ maxWidth: 1200 }}>

      {/* ═══ § 01 · EDITORIAL HERO ═══ */}
      <section style={{ paddingBottom: 56 }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span className="mono" style={{
            fontSize: 11,
            color: "var(--accent)",
            letterSpacing: ".06em",
          }}>
            &sect; 01
          </span>
          <span className="eyebrow">{greeting.label}</span>
          <div style={{ flex: 1, height: "0.5px", background: "var(--hairline)" }} />
          <span className="eyebrow">{greeting.sub}</span>
        </div>

        {/* Display heading */}
        <h1 style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 300,
          fontSize: "clamp(56px, 10vw, 156px)",
          lineHeight: 0.95,
          letterSpacing: "-0.025em",
          margin: 0,
          marginBottom: 24,
          color: "var(--ink)",
        }}>
          The fridge<br />
          <span style={{ fontStyle: "italic" }}>is your friend.</span>
        </h1>

        {/* Body text with inline stats */}
        <p style={{
          fontFamily: "var(--serif-body)",
          fontSize: 17,
          lineHeight: 1.65,
          color: "var(--ink-2)",
          maxWidth: 640,
        }}>
          {stats.total > 0 ? (
            <>
              You have baked{" "}
              <span className="num" style={{ fontWeight: 600, color: "var(--ink)" }}>{stats.total}</span>{" "}
              {stats.total === 1 ? "loaf" : "loaves"} so far, with{" "}
              <span className="num" style={{ fontWeight: 600, color: "var(--ink)" }}>{stats.thisMonth}</span>{" "}
              this {getMonthName().toLowerCase()}.{" "}
              {wisdom}
            </>
          ) : (
            <>
              Your journal is empty, your oven is cold, and the starter is waiting.{" "}
              {wisdom}
            </>
          )}
        </p>
      </section>

      {/* ═══ ACTIVE BAKE CARD ═══ */}
      {activeBake && (() => {
        const activeRecipe = getRecipeById(activeBake.recipe_id);
        const totalSteps = activeRecipe?.steps?.length || 0;
        // Estimate current step from time elapsed (simple heuristic)
        const currentStep = 1;
        const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

        return (
          <section style={{ marginBottom: 56 }}>
            <Link
              href={`/bake/${activeBake.recipe_id}?session=${activeBake.id}`}
              style={{
                display: "block",
                position: "relative",
                padding: "28px 32px",
                border: "0.5px solid var(--hairline)",
                textDecoration: "none",
                color: "inherit",
                overflow: "hidden",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              {/* Pulsing dot + eyebrow */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div
                  className="animate-gentle-pulse"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
                <span className="eyebrow" style={{ color: "var(--accent)" }}>
                  In the oven now
                </span>
              </div>

              {/* Recipe title + step counter */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
                <h2 style={{
                  fontFamily: "var(--serif-display)",
                  fontWeight: 300,
                  fontSize: "clamp(28px, 4vw, 42px)",
                  lineHeight: 1.05,
                  margin: 0,
                  color: "var(--ink)",
                }}>
                  {activeRecipe?.title || "Unknown Recipe"}
                </h2>
                <span className="mono" style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  letterSpacing: ".04em",
                  flexShrink: 0,
                }}>
                  {currentStep} / {totalSteps}
                </span>
              </div>

              {/* Step description */}
              <p style={{
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 15,
                color: "var(--muted)",
                margin: 0,
                marginBottom: 16,
              }}>
                Started {formatDistanceToNow(new Date(activeBake.started_at), { addSuffix: true })}
              </p>

              {/* Continue link */}
              <span style={{
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 15,
                color: "var(--ink)",
                borderBottom: "0.5px solid var(--ink)",
                paddingBottom: 2,
              }}>
                Continue bake &rarr;
              </span>

              {/* Progress hairline at bottom */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: 2,
                background: "var(--hairline)",
              }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "var(--accent)",
                  transition: "width 0.6s ease",
                }} />
              </div>
            </Link>
          </section>
        );
      })()}

      {/* ═══ § 02 · STATS ═══ */}
      <section style={{ marginBottom: 56 }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <span className="mono" style={{
            fontSize: 11,
            color: "var(--accent)",
            letterSpacing: ".06em",
          }}>
            &sect; 02
          </span>
          <span className="eyebrow">The month, in counts</span>
          <div style={{ flex: 1, height: "0.5px", background: "var(--hairline)" }} />
        </div>

        {/* Stats grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 0,
        }}>
          {[
            {
              value: stats.thisMonth,
              label: "Bakes this month",
              hint: stats.thisMonth === 0 ? "the oven awaits" : "and counting",
            },
            {
              value: stats.avgHydration ? `${stats.avgHydration}` : "—",
              label: "Avg hydration %",
              hint: stats.avgHydration ? "your comfort zone" : "no data yet",
            },
            {
              value: stats.avgRating ? `${stats.avgRating}` : "—",
              label: "Avg rating",
              hint: stats.avgRating ? "your harshest critic: you" : "rate your bakes",
            },
            {
              value: stats.total,
              label: "Lifetime bakes",
              hint: stats.total === 0 ? "let's start" : "and rising",
            },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                padding: "24px 20px",
                border: "0.5px solid var(--hairline)",
                marginRight: "-0.5px",
                marginBottom: "-0.5px",
              }}
            >
              <div style={{
                fontFamily: "var(--serif-display)",
                fontWeight: 300,
                fontSize: "clamp(42px, 5vw, 64px)",
                lineHeight: 1,
                color: "var(--ink)",
                marginBottom: 8,
              }}
              className="num"
              >
                {stat.value}
              </div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 13,
                color: "var(--muted)",
              }}>
                {stat.hint}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ § 03 · BAKE OF THE WEEK ═══ */}
      <section style={{ marginBottom: 56 }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <span className="mono" style={{
            fontSize: 11,
            color: "var(--accent)",
            letterSpacing: ".06em",
          }}>
            &sect; 03
          </span>
          <span className="eyebrow">Bake of the week</span>
          <div style={{ flex: 1, height: "0.5px", background: "var(--hairline)" }} />
          <span style={{
            fontFamily: "var(--serif-display)",
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--muted)",
          }}>
            Selected by Leo
          </span>
        </div>

        {/* 2-column layout */}
        <div
          className="boftw-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 32,
            alignItems: "center",
          }}
        >
          {/* Left: text */}
          <div>
            <h2 style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 300,
              fontSize: "clamp(32px, 5vw, 56px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: 16,
              color: "var(--ink)",
            }}>
              {featured.title}
            </h2>
            <p style={{
              fontFamily: "var(--serif-body)",
              fontSize: 16,
              lineHeight: 1.65,
              color: "var(--ink-2)",
              maxWidth: 480,
              marginBottom: 24,
            }}>
              {featured.description}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <Link
                href={`/recipes/${featured.id}`}
                className="btn"
                style={{ textDecoration: "none" }}
              >
                View recipe
              </Link>
              <div style={{
                display: "flex",
                gap: 16,
                fontSize: 12,
                color: "var(--muted)",
              }}>
                <span className="mono">{featured.totalTime}</span>
                {featured.hydration && <span className="mono">{featured.hydration}</span>}
                <span>{featured.difficulty}</span>
                {featuredBook && <span>{featuredBook.title}</span>}
              </div>
            </div>
          </div>

          {/* Right: image */}
          {featured.image ? (
            <div
              className="img-frame"
              style={{
                position: "relative",
                aspectRatio: "4/3",
                width: "100%",
              }}
            >
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              className="img-frame"
              style={{
                aspectRatio: "4/3",
                width: "100%",
                background: "var(--card-2)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span style={{
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 20,
                color: "var(--muted)",
              }}>
                No image yet
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ═══ ACTION DOORS ═══ */}
      <section style={{ marginBottom: 56 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 0,
        }}>
          {[
            {
              num: "01",
              title: "Browse the library",
              desc: `${recipes.length} recipes across ${books.length} books`,
              href: "/recipes",
            },
            {
              num: "02",
              title: "Start a bake",
              desc: "From mix to crust, step by step.",
              href: "/bake",
            },
            {
              num: "03",
              title: "Open the journal",
              desc: "Every loaf tells a story.",
              href: "/journal",
            },
          ].map((door) => (
            <Link
              key={door.num}
              href={door.href}
              style={{
                display: "block",
                padding: "28px 24px",
                border: "0.5px solid var(--hairline)",
                marginRight: "-0.5px",
                marginBottom: "-0.5px",
                textDecoration: "none",
                color: "inherit",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              {/* Numbered eyebrow */}
              <div className="eyebrow" style={{ marginBottom: 16, color: "var(--muted)" }}>
                <span className="mono" style={{ color: "var(--accent)", marginRight: 8, letterSpacing: ".06em" }}>
                  {door.num}
                </span>
              </div>

              {/* Title */}
              <h3 style={{
                fontFamily: "var(--serif-display)",
                fontWeight: 400,
                fontSize: "clamp(22px, 3vw, 32px)",
                lineHeight: 1.1,
                margin: 0,
                marginBottom: 8,
                color: "var(--ink)",
              }}>
                {door.title}
              </h3>

              {/* Description */}
              <p style={{
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 14,
                color: "var(--muted)",
                margin: 0,
                marginBottom: 20,
              }}>
                {door.desc}
              </p>

              {/* Enter link */}
              <span style={{
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 15,
                color: "var(--ink)",
                borderBottom: "0.5px solid var(--ink)",
                paddingBottom: 2,
              }}>
                Enter &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ § 04 · JOURNAL PREVIEW ═══ */}
      {recentBakes.length > 0 && (
        <section style={{ paddingBottom: 32 }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <span className="mono" style={{
              fontSize: 11,
              color: "var(--accent)",
              letterSpacing: ".06em",
            }}>
              &sect; 04
            </span>
            <span className="eyebrow">Recent notes</span>
            <div style={{ flex: 1, height: "0.5px", background: "var(--hairline)" }} />
            <Link
              href="/journal"
              style={{
                fontFamily: "var(--serif-display)",
                fontStyle: "italic",
                fontSize: 15,
                color: "var(--ink)",
                borderBottom: "0.5px solid var(--ink)",
                paddingBottom: 2,
                textDecoration: "none",
              }}
            >
              Read the journal &rarr;
            </Link>
          </div>

          {/* Bake list */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recentBakes.slice(0, 5).map((bake) => {
              const recipe = getRecipeById(bake.recipe_id);
              const bakeDate = new Date(bake.started_at);
              const dateStr = bakeDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <Link
                  key={bake.id}
                  href={`/journal/${bake.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr",
                    gap: 20,
                    padding: "16px 0",
                    borderBottom: "0.5px solid var(--hairline)",
                    textDecoration: "none",
                    color: "inherit",
                    alignItems: "start",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {/* Date column */}
                  <div className="mono" style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    paddingTop: 2,
                    letterSpacing: ".02em",
                  }}>
                    {dateStr}
                  </div>

                  {/* Content column */}
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      {/* Recipe name */}
                      <span style={{
                        fontFamily: "var(--serif-display)",
                        fontSize: 18,
                        fontWeight: 400,
                        color: "var(--ink)",
                        lineHeight: 1.2,
                      }}>
                        {recipe?.title || bake.recipe_id}
                      </span>

                      {/* Star rating */}
                      {bake.overall_rating && (
                        <span className="mono" style={{
                          fontSize: 12,
                          color: "var(--accent)",
                          letterSpacing: ".02em",
                        }}>
                          {"★".repeat(bake.overall_rating)}
                          {"☆".repeat(Math.max(0, 5 - bake.overall_rating))}
                        </span>
                      )}

                      {/* In-progress indicator */}
                      {bake.status === "in-progress" && (
                        <span
                          className="animate-gentle-pulse"
                          style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--accent)",
                          }}
                        />
                      )}
                    </div>

                    {/* Quoted note */}
                    {bake.overall_notes && (
                      <p style={{
                        fontFamily: "var(--serif-display)",
                        fontStyle: "italic",
                        fontSize: 14,
                        color: "var(--muted)",
                        margin: 0,
                        marginTop: 4,
                        lineHeight: 1.4,
                      }}>
                        &ldquo;{bake.overall_notes}&rdquo;
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
