"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, type BakeSession } from "@/lib/supabase";
import { recipes, getRecipeById, books } from "@/data/recipes";
import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";
import { Icon } from "@/components/illustrations/icons";
import { StatTile } from "@/components/ui/stat-tile";
import { ActionTile } from "@/components/ui/action-tile";
import { PickCard } from "@/components/ui/pick-card";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 7) return "Still up? Let's bake.";
  if (hour < 12) return "Rise and shine.";
  if (hour < 17) return "Afternoon proof.";
  return "Evening bake session.";
}

function getWeeklyRecipe() {
  const now = new Date();
  const weekIndex = Math.floor((now.getFullYear() * 52 + Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)))) % recipes.length;
  return recipes[weekIndex];
}

export default function HomePage() {
  const router = useRouter();
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

  const suggested = useMemo(
    () => [...recipes].sort(() => Math.random() - 0.5).slice(0, 3),
    [],
  );

  return (
    <div className="anim-rise proof-page" style={{ maxWidth: 1200 }}>
      {/* ── Hero ── */}
      <div style={{ marginBottom: 48 }}>
        <div className="label" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon.sparkle width={14} height={14} style={{ color: "var(--crust)" }} />
          {getGreeting()}
        </div>
        <h1 className="display" style={{ fontSize: 48, margin: 0, marginBottom: 12, letterSpacing: "-0.02em" }}>
          Dashboard.
        </h1>
        <p style={{ fontSize: 16, color: "var(--ink-soft)", margin: 0 }}>
          {getDailyWisdom()}
        </p>
      </div>

      {/* ── Active Bake Banner ── */}
      {activeBake && (
        <div className="anim-rise" style={{ marginBottom: 32 }}>
          <Link
            href={`/bake/${activeBake.recipe_id}?session=${activeBake.id}`}
            className="block"
            style={{
              borderRadius: "var(--radius-lg)",
              padding: 20,
              background: "var(--accent-surface)",
              border: "1px solid var(--border)",
              transition: "all 0.25s var(--ease-out)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                className="animate-gentle-pulse"
                style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--crust)" }}
              />
              <span
                style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--crust)" }}
              >
                Bake in progress
              </span>
            </div>
            <p style={{ fontWeight: 500, fontSize: 16, color: "var(--ink)" }}>
              {getRecipeById(activeBake.recipe_id)?.title || "Unknown Recipe"}
            </p>
            <p style={{ fontSize: 12, marginTop: 6, color: "var(--ink-mute)" }}>
              Started{" "}
              {formatDistanceToNow(new Date(activeBake.started_at), {
                addSuffix: true,
              })}
            </p>
          </Link>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="label" style={{ marginBottom: 14 }}>This month</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, marginBottom: 48 }}>
        <StatTile
          icon={<Icon.flame width={18} height={18} />}
          value={stats.total}
          label="Total bakes"
          tone="crust"
        />
        <StatTile
          icon={<Icon.calendar width={18} height={18} />}
          value={stats.thisMonth}
          label="This month"
          tone="leaf"
        />
        <StatTile
          icon={<Icon.trend width={18} height={18} />}
          value={stats.avgRating ? `${stats.avgRating}★` : "—"}
          label="Avg rating"
          tone="plum"
        />
      </div>

      {/* ── Quick Actions: What's baking? ── */}
      <div className="label" style={{ marginBottom: 14 }}>What&apos;s baking?</div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 48 }}>
        <ActionTile
          onClick={() => router.push("/recipes")}
          accent="crust"
          title="Browse the library"
          desc={`${recipes.length} recipes · infinite afternoons`}
        />
        <ActionTile
          onClick={() => router.push("/bake")}
          accent="jam"
          title="Start a bake"
          desc="From mix to crust, with a timer that nags."
        />
      </div>

      {/* ── Bake of the Week ── */}
      {(() => {
        const featured = getWeeklyRecipe();
        const book = books.find(b => b.id === featured.bookId);
        return (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 32, marginBottom: 48 }}>
            <div className="label" style={{ marginBottom: 16 }}>Bake of the week</div>
            <Link
              href={`/recipes/${featured.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: featured.image ? "1fr 1fr" : "1fr",
                gap: 32,
                alignItems: "center",
                textDecoration: "none",
                padding: 24,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                transition: "border-color 0.2s",
              }}
            >
              <div>
                <h2 className="display" style={{ fontSize: 32, margin: 0, marginBottom: 8, color: "var(--ink)" }}>
                  {featured.title}
                </h2>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0, marginBottom: 16 }}>
                  {featured.description}
                </p>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-mute)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{featured.totalTime}</span>
                  {featured.hydration && <span style={{ fontFamily: "var(--font-mono)" }}>{featured.hydration}</span>}
                  <span>{featured.difficulty}</span>
                  {book && <span>{book.title}</span>}
                </div>
              </div>
              {featured.image ? (
                <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: "var(--radius)", overflow: "hidden" }}>
                  <Image src={featured.image} alt={featured.title} fill sizes="400px" className="object-cover" />
                </div>
              ) : (
                <div style={{
                  display: "grid", placeItems: "center",
                  aspectRatio: "4/3", background: "var(--surface-2)",
                  borderRadius: "var(--radius)",
                }}>
                  <BreadIllustration seed={featured.id} size={120} />
                </div>
              )}
            </Link>
          </div>
        );
      })()}

      {/* ── Try Something New ── */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 32, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Icon.sparkle width={14} height={14} style={{ color: "var(--crust)" }} />
          <div className="label">Try something new</div>
        </div>
        <p style={{ fontSize: 14, color: "var(--ink-mute)", margin: 0, marginBottom: 18 }}>
          Recipes you haven&apos;t tried yet.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 48 }}>
        {suggested.map((recipe) => (
          <PickCard key={recipe.id} recipe={recipe} onClick={() => router.push(`/recipes/${recipe.id}`)} />
        ))}
      </div>

      {/* ── Recent Bakes ── */}
      {recentBakes.length > 0 && (
        <div className="anim-rise">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div className="label">Recent Bakes</div>
            <Link
              href="/journal"
              style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: "var(--crust)", textDecoration: "none" }}
            >
              View all <Icon.arrow width={12} height={12} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentBakes.slice(0, 3).map((bake) => {
              const recipe = getRecipeById(bake.recipe_id);
              return (
                <Link
                  key={bake.id}
                  href={`/journal/${bake.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: "var(--radius-lg)",
                    padding: 16,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    transition: "all 0.25s var(--ease-out)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                      {recipe?.title || bake.recipe_id}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--ink-mute)", margin: 0, marginTop: 4 }}>
                      {formatDistanceToNow(new Date(bake.started_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {bake.overall_rating && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 12, color: "var(--crust)" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                        {bake.overall_rating}
                      </span>
                      <Star size={12} fill="var(--crust)" stroke="var(--crust)" />
                    </div>
                  )}
                  {bake.status === "in-progress" && (
                    <div
                      className="animate-gentle-pulse"
                      style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--crust)", marginLeft: 12 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
