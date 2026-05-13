"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, type BakeSession } from "@/lib/supabase";
import { recipes, getRecipeById } from "@/data/recipes";
import { formatDistanceToNow } from "date-fns";
import { Icon } from "@/components/illustrations/icons";
import { StatTile } from "@/components/ui/stat-tile";
import { ActionTile } from "@/components/ui/action-tile";
import { PickCard } from "@/components/ui/pick-card";
import { BreadIllustration } from "@/components/illustrations/bread-illustration";
import { Steam } from "@/components/illustrations/steam";
import { Doughy } from "@/components/illustrations/doughy";
import { useDoughy } from "@/hooks/use-doughy";

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

export default function HomePage() {
  const router = useRouter();
  const [recentBakes, setRecentBakes] = useState<BakeSession[]>([]);
  const [activeBake, setActiveBake] = useState<BakeSession | null>(null);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, avgRating: 0 });
  const { happiness, mood, feed } = useDoughy();

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
      <div style={{ position: "relative", marginBottom: 40, display: "flex", alignItems: "flex-end", gap: 20, minHeight: 220 }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <div className="label" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon.sparkle width={14} height={14} style={{ color: "var(--crust)" }} />
            {getGreeting()}
          </div>
          <h1 className="display" style={{ fontSize: 76, margin: 0, marginBottom: 8, letterSpacing: "-0.02em" }}>
            <span className="doodle-underline">Dashboard.</span>
          </h1>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <div className="script" style={{ fontSize: 22, color: "var(--crust)" }}>
              {getDailyWisdom()}
            </div>
          </div>
        </div>
        {/* Hero bread illustration cluster */}
        <div className="proof-hero-art" style={{ position: "relative", width: 220, height: 220, flexShrink: 0, opacity: 0.95 }}>
          <div className="anim-float" style={{ position: "absolute", right: 0, top: 10 }}>
            <BreadIllustration seed="hero" size={180} />
          </div>
          <div className="anim-float" style={{ position: "absolute", left: 0, bottom: 20, animationDelay: "1.2s", opacity: 0.7 }}>
            <BreadIllustration seed="hero2" size={90} />
          </div>
          <div style={{ position: "absolute", top: -10, right: 70, width: 40, height: 30 }}>
            <Steam count={4} />
          </div>
        </div>
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

      {/* ── Stats: The Dough Report ── */}
      <div className="label" style={{ marginBottom: 14 }}>The Dough Report</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 48 }}>
        <StatTile
          icon={<Icon.flame width={18} height={18} />}
          value={stats.total}
          label="Total bakes"
          tone="crust"
          subtext={stats.total === 0 ? "oven is lonely" : "keep rising"}
        />
        <StatTile
          icon={<Icon.calendar width={18} height={18} />}
          value={stats.thisMonth}
          label="This month"
          tone="leaf"
          subtext={stats.thisMonth === 0 ? "let's change that" : "on a roll"}
        />
        <StatTile
          icon={<Icon.trend width={18} height={18} />}
          value={stats.avgRating ? `${stats.avgRating}★` : "—"}
          label="Avg rating"
          tone="plum"
          subtext={stats.avgRating ? "your harshest critic: you" : "no verdicts yet"}
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
          art={
            <div style={{ position: "relative", height: 120, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: -8 }}>
              <div style={{ transform: "rotate(-8deg) translateX(20px)" }}><BreadIllustration seed="b1" size={110} /></div>
              <div style={{ transform: "translateY(-10px)", zIndex: 2 }}><BreadIllustration seed="b2" size={130} /></div>
              <div style={{ transform: "rotate(10deg) translateX(-20px)" }}><BreadIllustration seed="b3" size={110} /></div>
            </div>
          }
        />
        <ActionTile
          onClick={() => router.push("/bake")}
          accent="jam"
          title="Start a bake"
          desc="From mix to crust, with a timer that nags."
          art={
            <div style={{ position: "relative", height: 120, display: "grid", placeItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Steam count={6} />
                <BreadIllustration seed="hot" size={100} />
              </div>
            </div>
          }
        />
      </div>

      {/* ── Try Something New ── */}
      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 32, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Icon.sparkle width={14} height={14} style={{ color: "var(--crust)" }} />
          <div className="label">Try something new</div>
        </div>
        <div className="script" style={{ fontSize: 18, color: "var(--crust)", marginBottom: 18 }}>
          pick a friend, any friend.
        </div>
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
                      <span style={{ fontSize: 10 }}>{"★"}</span>
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

      {/* ── Doughy nag banner ── */}
      {happiness < 50 && (
        <div className="anim-rise" style={{
          marginTop: 48, padding: "18px 22px",
          background: "linear-gradient(135deg, rgba(199,90,58,0.15), rgba(232,155,60,0.08))",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <Doughy happiness={happiness} mood={mood} size={56} />
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 22, fontStyle: "italic" }}>Doughy is peckish.</div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>It&apos;s been a while. Feed equal flour + water, leave covered for 4&ndash;6 hours.</div>
          </div>
          <button type="button" onClick={feed} style={{
            padding: "10px 18px", background: "var(--crust)", border: "none",
            color: "var(--bg)", borderRadius: 999, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>Feed now</button>
        </div>
      )}
    </div>
  );
}
