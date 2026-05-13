"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Thermometer,
  Wheat,
  Trash2,
  Edit3,
  Save,
  ChefHat,
  Share2,
} from "lucide-react";
import { supabase, type BakeSession, type BakeStepLog } from "@/lib/supabase";
import { getRecipeById } from "@/data/recipes";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [bake, setBake] = useState<BakeSession | null>(null);
  const [stepLogs, setStepLogs] = useState<BakeStepLog[]>([]);
  const [editing, setEditing] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editWell, setEditWell] = useState("");
  const [editImprove, setEditImprove] = useState("");
  const [editMods, setEditMods] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBake();
  }, [id]);

  async function loadBake() {
    const { data: session } = await supabase
      .from("bake_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (session) {
      setBake(session);
      setEditNotes(session.overall_notes || "");
      setEditWell(session.what_went_well || "");
      setEditImprove(session.what_to_improve || "");
      setEditMods(session.modifications || "");
    }

    const { data: logs } = await supabase
      .from("bake_step_logs")
      .select("*")
      .eq("session_id", id)
      .order("step_number", { ascending: true });

    if (logs) setStepLogs(logs);
    setLoading(false);
  }

  async function saveEdits() {
    if (!bake) return;
    await supabase
      .from("bake_sessions")
      .update({
        overall_notes: editNotes || null,
        what_went_well: editWell || null,
        what_to_improve: editImprove || null,
        modifications: editMods || null,
      })
      .eq("id", bake.id);

    setBake({
      ...bake,
      overall_notes: editNotes || null,
      what_went_well: editWell || null,
      what_to_improve: editImprove || null,
      modifications: editMods || null,
    });
    setEditing(false);
  }

  async function shareBake() {
    if (!bake || !recipe) return;
    const stars = bake.overall_rating ? "★".repeat(bake.overall_rating) + "☆".repeat(5 - bake.overall_rating) : "";
    const text = `Just baked ${recipe.title}${stars ? ` ${stars}` : ""} with Proof 🍞`;
    if (navigator.share) {
      await navigator.share({ title: "My Bake", text, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    }
  }

  async function deleteBake() {
    if (!bake || !confirm("Delete this bake log? This cannot be undone."))
      return;
    await supabase.from("bake_sessions").delete().eq("id", bake.id);
    router.push("/journal");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  if (!bake) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>Bake not found</p>
      </div>
    );
  }

  const recipe = getRecipeById(bake.recipe_id);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="px-5 pt-14 pb-2 lg:pt-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm mb-4 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between">
              <div>
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
                <h1 className="font-[family-name:var(--font-playfair)] text-2xl lg:text-3xl font-semibold tracking-tight mt-2" style={{ color: "var(--text)" }}>
                  {recipe?.title || bake.recipe_id}
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={shareBake}
                  className="p-2 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="p-2 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={deleteBake}
                  className="p-2 transition-colors hover:text-rose-400"
                  style={{ color: "var(--text-faint)" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {format(new Date(bake.started_at), "EEE, MMM d yyyy · h:mm a")}
              </span>
              {bake.completed_at && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDistanceToNow(new Date(bake.started_at))} total
                </span>
              )}
            </div>

            {recipe && (
              <Link
                href={`/bake/${recipe.id}`}
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium"
                style={{ color: "var(--accent)" }}
              >
                <ChefHat size={12} /> Bake this again
              </Link>
            )}
          </motion.div>
        </div>

        <div className="px-5 py-4 space-y-6 pb-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-6">
            {(bake.overall_rating ||
              bake.crumb_rating ||
              bake.crust_rating ||
              bake.flavor_rating) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                  Ratings
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Overall", value: bake.overall_rating },
                    { label: "Crumb", value: bake.crumb_rating },
                    { label: "Crust", value: bake.crust_rating },
                    { label: "Flavor", value: bake.flavor_rating },
                  ]
                    .filter((r) => r.value)
                    .map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3"
                        style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}
                      >
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                          {label}
                        </p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className="text-sm"
                              style={{ color: star <= (value || 0) ? "var(--accent)" : "var(--text-ghost)" }}
                            >
                              &#9733;
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {(bake.flour_brand || bake.ambient_temp_f || bake.dough_temp_f || bake.humidity_percent || bake.starter_hydration || bake.bulk_fermentation_hours || bake.bake_temp_f) && (
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider mb-2 mt-5 lg:mt-0" style={{ color: "var(--text-muted)" }}>
                  Environment & Data
                </h3>
                <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}>
                  {bake.flour_brand && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wheat size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Flour:</span>
                      <span style={{ color: "var(--text)" }}>{bake.flour_brand}</span>
                    </div>
                  )}
                  {bake.ambient_temp_f != null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Room:</span>
                      <span style={{ color: "var(--text)" }}>{bake.ambient_temp_f}°C</span>
                    </div>
                  )}
                  {bake.dough_temp_f != null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Dough:</span>
                      <span style={{ color: "var(--text)" }}>{bake.dough_temp_f}°C</span>
                    </div>
                  )}
                  {bake.humidity_percent != null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Humidity:</span>
                      <span style={{ color: "var(--text)" }}>{bake.humidity_percent}%</span>
                    </div>
                  )}
                  {bake.starter_hydration && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wheat size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Starter:</span>
                      <span style={{ color: "var(--text)" }}>{bake.starter_hydration} hydration</span>
                    </div>
                  )}
                  {bake.starter_notes && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wheat size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Starter notes:</span>
                      <span style={{ color: "var(--text)" }}>{bake.starter_notes}</span>
                    </div>
                  )}
                  {bake.bulk_fermentation_hours != null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Bulk:</span>
                      <span style={{ color: "var(--text)" }}>{bake.bulk_fermentation_hours}hrs</span>
                    </div>
                  )}
                  {bake.proof_hours != null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Proof:</span>
                      <span style={{ color: "var(--text)" }}>{bake.proof_hours}hrs</span>
                    </div>
                  )}
                  {bake.bake_time_minutes != null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Bake:</span>
                      <span style={{ color: "var(--text)" }}>{bake.bake_time_minutes}min at {bake.bake_temp_f || "—"}°C</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {editing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 max-w-2xl"
            >
              {[
                { label: "What went well", value: editWell, setter: setEditWell },
                { label: "What to improve", value: editImprove, setter: setEditImprove },
                { label: "Modifications", value: editMods, setter: setEditMods },
                { label: "Overall notes", value: editNotes, setter: setEditNotes },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </label>
                  <textarea
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full rounded-xl p-3 text-sm resize-none h-20 focus:outline-none transition-colors"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={saveEdits}
                className="w-full md:w-auto md:px-12 font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
              >
                <Save size={14} /> Save Changes
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "What went well", value: bake.what_went_well, color: "#34d399" },
                { label: "To improve", value: bake.what_to_improve, color: "var(--accent)" },
                { label: "Modifications", value: bake.modifications, color: "var(--text-muted)" },
                { label: "Notes", value: bake.overall_notes, color: "var(--text-muted)" },
              ]
                .filter((n) => n.value)
                .map(({ label, value, color }) => (
                  <div key={label}>
                    <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color }}>
                      {label}
                    </h3>
                    <p className="text-sm rounded-xl p-3 leading-relaxed" style={{ color: "var(--text-secondary)", background: "var(--card)", border: "1px solid var(--border-subtle)" }}>
                      {value}
                    </p>
                  </div>
                ))}
            </div>
          )}

          {stepLogs.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Step Log
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {stepLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl p-3"
                    style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {log.step_title}
                      </p>
                      {log.completed_at && (
                        <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                          {format(new Date(log.completed_at), "h:mm a")}
                        </p>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{log.notes}</p>
                    )}
                    {log.temperature_reading && (
                      <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>
                        {log.temperature_reading}°C
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
