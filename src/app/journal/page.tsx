"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, type BakeSession } from "@/lib/supabase";
import { getRecipeById } from "@/data/recipes";
import { format } from "date-fns";

const filterItems = ["all", "completed", "in-progress"] as const;
const filterLabels: Record<string, string> = {
  all: "All",
  completed: "Completed",
  "in-progress": "In Progress",
};

export default function JournalPage() {
  const [bakes, setBakes] = useState<BakeSession[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "in-progress">("all");
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
    <div style={{ padding: "0 var(--pad-x) var(--pad-y)" }}>

      {/* Header */}
      <section style={{ padding: "calc(var(--pad-y) * .8) 0 calc(var(--pad-y) * .5)" }}>
        <div className="eyebrow" style={{ marginBottom: 18, display: "flex", gap: 14 }}>
          <span className="mono" style={{ color: "var(--accent)" }}>§ Journal</span>
          <span>Field notes from a working kitchen</span>
        </div>
        <h1 style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 300,
          fontSize: "clamp(48px, 8vw, 120px)",
          lineHeight: .92,
          letterSpacing: "-.03em",
          margin: 0,
        }}>
          Tasting <span className="italic">notes</span>
        </h1>
      </section>

      {/* Filter row */}
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        marginBottom: 48,
        paddingBottom: 18,
        borderBottom: ".5px solid var(--hairline)",
      }}>
        <div className="eyebrow" style={{ minWidth: 60, fontSize: 10.5 }}>Filter</div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {filterItems.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                fontFamily: "var(--serif-display)",
                fontStyle: filter === f ? "italic" : "normal",
                fontSize: 16,
                color: filter === f ? "var(--ink)" : "var(--muted)",
                borderBottom: filter === f ? "1px solid var(--ink)" : "1px solid transparent",
                paddingBottom: 2,
                background: "none",
                border: "none",
                borderBottomWidth: 1,
                borderBottomStyle: "solid",
                borderBottomColor: filter === f ? "var(--ink)" : "transparent",
                cursor: "default",
                transition: "color .2s ease, border-color .2s ease",
              }}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            border: "2px solid var(--hairline)",
            borderTopColor: "var(--accent)",
            animation: "spin 1s linear infinite",
          }} />
        </div>
      ) : bakes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p className="italic" style={{
            fontFamily: "var(--serif-display)",
            fontSize: 28,
            color: "var(--muted)",
            marginBottom: 12,
          }}>
            A blank page.
          </p>
          <p style={{ fontSize: 15, color: "var(--muted-2)" }}>
            Your first loaf is calling.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Object.entries(grouped).map(([month, monthBakes]) => (
            <li key={month} style={{ marginBottom: 48 }}>
              {/* Month header */}
              <div className="eyebrow" style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 24,
              }}>
                <span className="mono" style={{ color: "var(--accent)" }}>§</span>
                <span>{month}</span>
                <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
              </div>

              {/* Bake entries */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {monthBakes.map((bake) => {
                  const recipe = getRecipeById(bake.recipe_id);
                  return (
                    <li key={bake.id}>
                      <Link
                        href={`/journal/${bake.id}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "90px 1fr",
                          gap: 28,
                          padding: "28px 0",
                          borderBottom: ".5px solid var(--hairline)",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {/* Date column */}
                        <div>
                          <div className="mono" style={{
                            fontSize: 11,
                            letterSpacing: ".16em",
                            color: "var(--muted)",
                            textTransform: "uppercase",
                          }}>
                            {format(new Date(bake.started_at), "MMM d")}
                          </div>
                          {bake.overall_rating && (
                            <div className="mono" style={{
                              fontSize: 12,
                              color: "var(--accent)",
                              marginTop: 6,
                              letterSpacing: ".1em",
                            }}>
                              {"★".repeat(bake.overall_rating)}
                              <span style={{ color: "var(--hairline-2)" }}>
                                {"★".repeat(5 - bake.overall_rating)}
                              </span>
                            </div>
                          )}
                          {bake.status === "in-progress" && (
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 8,
                            }}>
                              <span style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: "var(--accent)",
                                animation: "pulse 2s ease-in-out infinite",
                              }} />
                              <span className="mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                                Active
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content column */}
                        <div>
                          <h3 style={{
                            fontFamily: "var(--serif-display)",
                            fontSize: "clamp(22px, 2.5vw, 28px)",
                            fontWeight: 400,
                            marginBottom: 10,
                            margin: 0,
                          }}>
                            {recipe?.title || bake.recipe_id}
                          </h3>
                          <div className="mono" style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            letterSpacing: ".1em",
                            marginTop: 4,
                          }}>
                            {format(new Date(bake.started_at), "h:mm a")}
                            {bake.status === "completed" && " · completed"}
                          </div>
                          {bake.overall_notes && (
                            <p className="italic" style={{
                              fontSize: 17,
                              color: "var(--ink-2)",
                              lineHeight: 1.55,
                              maxWidth: 760,
                              marginTop: 10,
                            }}>
                              &ldquo;{bake.overall_notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
