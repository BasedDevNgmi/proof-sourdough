"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { format, formatDistanceToNow } from "date-fns";
import { FeedingCalendar } from "@/components/ui/feeding-calendar";

interface StarterFeeding {
  id: string;
  user_id: string;
  fed_at: string;
  flour_type: string | null;
  flour_grams: number | null;
  water_grams: number | null;
  starter_grams: number | null;
  hydration: string | null;
  room_temp_c: number | null;
  peak_hours: number | null;
  notes: string | null;
  created_at: string;
}

export default function StarterPage() {
  const { user } = useAuth();
  const [feedings, setFeedings] = useState<StarterFeeding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [flourType, setFlourType] = useState("All-purpose");
  const [flourGrams, setFlourGrams] = useState("50");
  const [waterGrams, setWaterGrams] = useState("50");
  const [starterGrams, setStarterGrams] = useState("50");
  const [roomTemp, setRoomTemp] = useState("");
  const [peakHours, setPeakHours] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadFeedings();
  }, []);

  async function loadFeedings() {
    const { data } = await supabase
      .from("starter_feedings")
      .select("*")
      .order("fed_at", { ascending: false })
      .limit(50);
    setFeedings(data || []);
    setLoading(false);
  }

  function calcHydration(): string {
    const f = parseFloat(flourGrams);
    const w = parseFloat(waterGrams);
    if (!f || !w || f === 0) return "—";
    return `${Math.round((w / f) * 100)}%`;
  }

  async function logFeeding() {
    if (!user) return;
    setSaving(true);
    const hydration = calcHydration();

    const { data } = await supabase
      .from("starter_feedings")
      .insert({
        user_id: user.id,
        flour_type: flourType || null,
        flour_grams: flourGrams ? parseFloat(flourGrams) : null,
        water_grams: waterGrams ? parseFloat(waterGrams) : null,
        starter_grams: starterGrams ? parseFloat(starterGrams) : null,
        hydration: hydration !== "—" ? hydration : null,
        room_temp_c: roomTemp ? parseFloat(roomTemp) : null,
        peak_hours: peakHours ? parseFloat(peakHours) : null,
        notes: notes || null,
      })
      .select()
      .single();

    if (data) {
      setFeedings((prev) => [data, ...prev]);
    }

    setSaving(false);
    setShowForm(false);
    setNotes("");
    setPeakHours("");
    setRoomTemp("");
  }

  async function deleteFeeding(id: string) {
    if (!confirm("Delete this feeding log?")) return;
    await supabase.from("starter_feedings").delete().eq("id", id);
    setFeedings((prev) => prev.filter((f) => f.id !== id));
  }

  const lastFed = feedings[0]?.fed_at;
  const avgPeak =
    feedings.filter((f) => f.peak_hours).length > 0
      ? (
          feedings.reduce((sum, f) => sum + (f.peak_hours || 0), 0) /
          feedings.filter((f) => f.peak_hours).length
        ).toFixed(1)
      : null;

  const starterAge = feedings.length;
  const lastFedDistance = lastFed
    ? formatDistanceToNow(new Date(lastFed), { addSuffix: true })
    : null;
  const estimatedRipe = avgPeak ? `~${avgPeak} hrs` : "—";
  const currentHydration =
    feedings[0]?.hydration || "—";

  return (
    <div className="anim-rise proof-page">
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {/* Header */}
        <div className="eyebrow" style={{ marginBottom: 20 }}>
          &sect; Starter &middot; The slow heart of the kitchen
        </div>

        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 300,
            fontSize: "clamp(56px, 10vw, 132px)",
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            margin: 0,
            marginBottom: 8,
            color: "var(--ink)",
          }}
        >
          My Starter
          <br />
          <span style={{ fontStyle: "italic", fontWeight: 400 }}>
            &mdash; est. 2024
          </span>
        </h1>

        <p
          style={{
            fontFamily: "var(--serif-body)",
            fontSize: 16,
            color: "var(--muted)",
            lineHeight: 1.5,
            marginBottom: 40,
          }}
        >
          {lastFed
            ? `Last fed ${lastFedDistance}. ${avgPeak ? `Should be ripe in ~${avgPeak} hours.` : ""}`
            : "No feedings logged yet."}
        </p>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "0.5px solid var(--hairline)",
            borderBottom: "0.5px solid var(--hairline)",
            marginBottom: 40,
          }}
        >
          {[
            { value: lastFedDistance || "—", label: "Since last feed" },
            { value: estimatedRipe, label: "Estimated ripe" },
            { value: currentHydration, label: "Hydration" },
            { value: `${starterAge}`, label: "Feedings logged" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "20px 16px",
                borderRight:
                  i < 3 ? "0.5px solid var(--hairline)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--serif-display)",
                  fontSize: "clamp(34px, 4vw, 52px)",
                  fontWeight: 300,
                  lineHeight: 1.1,
                  color: "var(--ink)",
                  marginBottom: 6,
                  letterSpacing: "-0.01em",
                }}
              >
                {stat.value}
              </div>
              <div className="eyebrow">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Log Feeding Button */}
        <div style={{ marginBottom: 32 }}>
          <button
            type="button"
            className="btn"
            onClick={() => setShowForm(!showForm)}
          >
            Log a feeding &rarr;
          </button>
        </div>

        {/* Feeding Form */}
        {showForm && (
          <div
            style={{
              border: "0.5px solid var(--hairline)",
              borderRadius: "var(--radius)",
              background: "var(--card)",
              padding: 32,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <div className="eyebrow">New Feeding</div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  fontFamily: "var(--serif-display)",
                  fontSize: 14,
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            {/* Ratio inputs */}
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Ratio (grams)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 20,
                marginBottom: 12,
              }}
            >
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Starter
                </div>
                <input
                  type="number"
                  value={starterGrams}
                  onChange={(e) => setStarterGrams(e.target.value)}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 18,
                    textAlign: "center",
                    borderBottom: "0.5px solid var(--hairline-2)",
                    background: "transparent",
                    color: "var(--ink)",
                    padding: "10px 4px",
                    width: "100%",
                    border: "none",
                    borderBottomStyle: "solid",
                    borderBottomWidth: "0.5px",
                    borderBottomColor: "var(--hairline-2)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Flour
                </div>
                <input
                  type="number"
                  value={flourGrams}
                  onChange={(e) => setFlourGrams(e.target.value)}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 18,
                    textAlign: "center",
                    background: "transparent",
                    color: "var(--ink)",
                    padding: "10px 4px",
                    width: "100%",
                    border: "none",
                    borderBottomStyle: "solid",
                    borderBottomWidth: "0.5px",
                    borderBottomColor: "var(--hairline-2)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Water
                </div>
                <input
                  type="number"
                  value={waterGrams}
                  onChange={(e) => setWaterGrams(e.target.value)}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 18,
                    textAlign: "center",
                    background: "transparent",
                    color: "var(--ink)",
                    padding: "10px 4px",
                    width: "100%",
                    border: "none",
                    borderBottomStyle: "solid",
                    borderBottomWidth: "0.5px",
                    borderBottomColor: "var(--hairline-2)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Hydration calc */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 28,
                fontFamily: "var(--mono)",
                fontSize: 14,
                color: "var(--muted)",
              }}
            >
              {calcHydration()} hydration
            </div>

            {/* Flour type + Room temp */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Flour type
                </div>
                <input
                  type="text"
                  value={flourType}
                  onChange={(e) => setFlourType(e.target.value)}
                  placeholder="All-purpose"
                  style={{
                    fontFamily: "var(--serif-body)",
                    fontSize: 15,
                    background: "transparent",
                    color: "var(--ink)",
                    padding: "10px 4px",
                    width: "100%",
                    border: "none",
                    borderBottomStyle: "solid",
                    borderBottomWidth: "0.5px",
                    borderBottomColor: "var(--hairline-2)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Room temp (&deg;C)
                </div>
                <input
                  type="number"
                  value={roomTemp}
                  onChange={(e) => setRoomTemp(e.target.value)}
                  placeholder="22"
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 15,
                    background: "transparent",
                    color: "var(--ink)",
                    padding: "10px 4px",
                    width: "100%",
                    border: "none",
                    borderBottomStyle: "solid",
                    borderBottomWidth: "0.5px",
                    borderBottomColor: "var(--hairline-2)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Peak hours + Notes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                marginBottom: 28,
              }}
            >
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Peak hours
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={peakHours}
                  onChange={(e) => setPeakHours(e.target.value)}
                  placeholder="5.5"
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 15,
                    background: "transparent",
                    color: "var(--ink)",
                    padding: "10px 4px",
                    width: "100%",
                    border: "none",
                    borderBottomStyle: "solid",
                    borderBottomWidth: "0.5px",
                    borderBottomColor: "var(--hairline-2)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Notes
                </div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Doubled nicely, sweet aroma..."
                  style={{
                    fontFamily: "var(--serif-body)",
                    fontSize: 15,
                    fontStyle: "italic",
                    background: "transparent",
                    color: "var(--ink)",
                    padding: "10px 4px",
                    width: "100%",
                    border: "none",
                    borderBottomStyle: "solid",
                    borderBottomWidth: "0.5px",
                    borderBottomColor: "var(--hairline-2)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn"
              onClick={logFeeding}
              disabled={saving}
              style={{ opacity: saving ? 0.5 : 1 }}
            >
              {saving ? "Saving..." : "Log Feeding"}
            </button>
          </div>
        )}

        {/* Week view feeding calendar */}
        <div style={{ marginBottom: 40 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            This week
          </div>
          <FeedingCalendar feedings={feedings} />
        </div>

        {/* Feeding History */}
        <div style={{ paddingBottom: 60 }}>
          <div className="eyebrow" style={{ marginBottom: 20 }}>
            Feeding History
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "60px 0",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: "2px solid var(--hairline)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "pulse 1s linear infinite",
                }}
              />
            </div>
          ) : feedings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div
                style={{
                  fontFamily: "var(--serif-display)",
                  fontWeight: 300,
                  fontSize: 28,
                  fontStyle: "italic",
                  marginBottom: 8,
                  color: "var(--ink)",
                }}
              >
                No feedings yet.
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  fontStyle: "italic",
                }}
              >
                log your first feeding above.
              </div>
            </div>
          ) : (
            <div>
              {feedings.map((f) => (
                <div
                  key={f.id}
                  style={{
                    borderBottom: "0.5px solid var(--hairline)",
                    padding: "20px 0",
                  }}
                >
                  {/* Date row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                      <span
                        style={{
                          fontFamily: "var(--serif-display)",
                          fontSize: 18,
                          fontWeight: 400,
                          color: "var(--ink)",
                        }}
                      >
                        {format(new Date(f.fed_at), "EEE, MMM d")}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        {formatDistanceToNow(new Date(f.fed_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteFeeding(f.id)}
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: "var(--muted-2)",
                        cursor: "pointer",
                        letterSpacing: "0.05em",
                      }}
                    >
                      delete
                    </button>
                  </div>

                  {/* Details row */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 16,
                      alignItems: "baseline",
                    }}
                  >
                    {f.starter_grams != null &&
                      f.flour_grams != null &&
                      f.water_grams != null && (
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 13,
                            color: "var(--ink-2)",
                          }}
                        >
                          {f.starter_grams}:{f.flour_grams}:{f.water_grams}g
                        </span>
                      )}
                    {f.hydration && (
                      <span className="eyebrow" style={{ fontSize: 11 }}>
                        {f.hydration}
                      </span>
                    )}
                    {f.flour_type && (
                      <span className="eyebrow" style={{ fontSize: 11 }}>
                        {f.flour_type}
                      </span>
                    )}
                    {f.room_temp_c != null && (
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        {f.room_temp_c}&deg;C
                      </span>
                    )}
                    {f.peak_hours != null && (
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        peaked at {f.peak_hours}hrs
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {f.notes && (
                    <p
                      style={{
                        fontFamily: "var(--serif-display)",
                        fontStyle: "italic",
                        fontSize: 15,
                        color: "var(--ink-2)",
                        marginTop: 8,
                        lineHeight: 1.4,
                      }}
                    >
                      &ldquo;{f.notes}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
