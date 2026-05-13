"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Droplets, Wheat, Thermometer, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Doughy } from "@/components/illustrations/doughy";
import { useDoughy } from "@/hooks/use-doughy";
import { format, formatDistanceToNow } from "date-fns";

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
  const { happiness, mood, feed: feedDoughy } = useDoughy();
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
      feedDoughy();
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

  return (
    <div className="anim-rise proof-page">
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="My Starter"
          subtitle="Track feedings, watch patterns emerge."
          scriptTag="the sourdough diary within the diary."
        />

        {/* Doughy status card */}
        <div
          className="mx-5 mb-8 rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, var(--surface-2), var(--surface))",
            border: "1px dashed var(--border-strong)",
          }}
        >
          <div className="flex items-center gap-5">
            <button type="button" onClick={feedDoughy} className="shrink-0" style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Doughy happiness={happiness} mood={mood} size={80} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="display" style={{ fontSize: 24 }}>Doughy</span>
                <span className="script" style={{ fontSize: 16, color: "var(--crust)" }}>
                  {happiness > 80 ? "thriving!" : happiness > 60 ? "doing well." : happiness > 30 ? "getting hungry..." : "feed me!"}
                </span>
              </div>
              <div className="flex gap-4 text-xs" style={{ color: "var(--ink-mute)" }}>
                {lastFed && (
                  <span>Last fed: {formatDistanceToNow(new Date(lastFed), { addSuffix: true })}</span>
                )}
                {avgPeak && <span>Avg peak: {avgPeak}hrs</span>}
                <span>Feedings logged: {feedings.length}</span>
              </div>
              <div className="mt-3" style={{ height: 5, background: "var(--surface-3)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${happiness}%`,
                    background:
                      happiness > 60
                        ? "linear-gradient(90deg, var(--leaf), var(--leaf-soft))"
                        : happiness > 30
                        ? "linear-gradient(90deg, var(--butter), var(--crust))"
                        : "linear-gradient(90deg, var(--jam), var(--jam-soft))",
                    transition: "width 0.6s var(--ease-out)",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Log Feeding Button */}
        <div className="px-5 mb-6">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "var(--crust)", color: "var(--bg)" }}
          >
            <Plus size={16} /> Log a Feeding
          </button>
        </div>

        {/* Feeding Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 mb-8 overflow-hidden"
            >
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-mute)" }}>
                    New Feeding
                  </span>
                  <button type="button" onClick={() => setShowForm(false)} style={{ color: "var(--ink-mute)", background: "none", border: "none", cursor: "pointer" }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Ratio inputs */}
                <div>
                  <label className="text-xs mb-2 block" style={{ color: "var(--ink-mute)" }}>
                    Ratio (grams)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "var(--ink-faint)" }}>Starter</span>
                      <input
                        type="number"
                        value={starterGrams}
                        onChange={(e) => setStarterGrams(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "var(--ink-faint)" }}>Flour</span>
                      <input
                        type="number"
                        value={flourGrams}
                        onChange={(e) => setFlourGrams(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "var(--ink-faint)" }}>Water</span>
                      <input
                        type="number"
                        value={waterGrams}
                        onChange={(e) => setWaterGrams(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                      />
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="script" style={{ fontSize: 16, color: "var(--crust)" }}>
                      {calcHydration()} hydration
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--ink-mute)" }}>Flour type</label>
                    <input
                      type="text"
                      value={flourType}
                      onChange={(e) => setFlourType(e.target.value)}
                      placeholder="All-purpose"
                      className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--ink-mute)" }}>Room temp (°C)</label>
                    <input
                      type="number"
                      value={roomTemp}
                      onChange={(e) => setRoomTemp(e.target.value)}
                      placeholder="22"
                      className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--ink-mute)" }}>Time to peak (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={peakHours}
                    onChange={(e) => setPeakHours(e.target.value)}
                    placeholder="5.5"
                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--ink-mute)" }}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Doubled nicely, sweet aroma, good bubble structure..."
                    className="w-full rounded-xl p-3 text-sm resize-none h-16 focus:outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                  />
                </div>

                <button
                  type="button"
                  onClick={logFeeding}
                  disabled={saving}
                  className="w-full font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-50"
                  style={{ background: "var(--crust)", color: "var(--bg)" }}
                >
                  {saving ? "Saving..." : "Log Feeding"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feeding History */}
        <div className="px-5 pb-8">
          <div className="label" style={{ marginBottom: 14 }}>Feeding History</div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--crust)" }} />
            </div>
          ) : feedings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div className="display" style={{ fontSize: 24, fontStyle: "italic", marginBottom: 6 }}>No feedings yet.</div>
              <div className="script" style={{ fontSize: 18, color: "var(--crust)" }}>log your first feeding above.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {feedings.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                        {format(new Date(f.fed_at), "EEE, MMM d · h:mm a")}
                      </span>
                      <span className="text-xs ml-2" style={{ color: "var(--ink-faint)" }}>
                        {formatDistanceToNow(new Date(f.fed_at), { addSuffix: true })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteFeeding(f.id)}
                      className="p-1 transition-colors"
                      style={{ color: "var(--ink-faint)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--ink-soft)" }}>
                    {f.starter_grams != null && f.flour_grams != null && f.water_grams != null && (
                      <span className="flex items-center gap-1">
                        <Wheat size={11} />
                        {f.starter_grams}:{f.flour_grams}:{f.water_grams}g
                      </span>
                    )}
                    {f.hydration && (
                      <span className="flex items-center gap-1">
                        <Droplets size={11} />
                        {f.hydration}
                      </span>
                    )}
                    {f.flour_type && (
                      <span>{f.flour_type}</span>
                    )}
                    {f.room_temp_c != null && (
                      <span className="flex items-center gap-1">
                        <Thermometer size={11} />
                        {f.room_temp_c}°C
                      </span>
                    )}
                    {f.peak_hours != null && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        peaked at {f.peak_hours}hrs
                      </span>
                    )}
                  </div>

                  {f.notes && (
                    <p className="script mt-2" style={{ fontSize: 15, color: "var(--ink-soft)" }}>
                      &quot;{f.notes}&quot;
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
