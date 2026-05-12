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

  async function deleteBake() {
    if (!bake || !confirm("Delete this bake log? This cannot be undone."))
      return;
    await supabase.from("bake_sessions").delete().eq("id", bake.id);
    router.push("/journal");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!bake) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Bake not found</p>
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
            className="flex items-center gap-1.5 text-stone-500 text-sm mb-4 active:text-stone-300 hover:text-stone-300 transition-colors"
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
                <h1 className="font-[family-name:var(--font-playfair)] text-2xl lg:text-3xl font-semibold tracking-tight text-stone-100 mt-2">
                  {recipe?.title || bake.recipe_id}
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="p-2 text-stone-500 active:text-stone-300 hover:text-stone-300"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={deleteBake}
                  className="p-2 text-stone-600 active:text-rose-400 hover:text-rose-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-stone-500">
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

            {/* Bake again link */}
            {recipe && (
              <Link
                href={`/bake/${recipe.id}`}
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-amber-500 font-medium hover:text-amber-400"
              >
                <ChefHat size={12} /> Bake this again
              </Link>
            )}
          </motion.div>
        </div>

        <div className="px-5 py-4 space-y-5 pb-8">
          {/* Desktop: two-column layout for ratings + notes */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-6">
            {/* Ratings */}
            {(bake.overall_rating ||
              bake.crumb_rating ||
              bake.crust_rating ||
              bake.flavor_rating) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
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
                        className="bg-stone-900 rounded-xl p-3 border border-stone-800/50"
                      >
                        <p className="text-[10px] text-stone-600 uppercase tracking-wider">
                          {label}
                        </p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= (value || 0)
                                  ? "text-amber-500"
                                  : "text-stone-700"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Environment */}
            {(bake.flour_brand || bake.ambient_temp_f) && (
              <div>
                <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2 mt-5 lg:mt-0">
                  Environment
                </h3>
                <div className="bg-stone-900 rounded-xl p-3 border border-stone-800/50 space-y-2">
                  {bake.flour_brand && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wheat size={13} className="text-stone-600" />
                      <span className="text-stone-400">Flour:</span>
                      <span className="text-stone-200">{bake.flour_brand}</span>
                    </div>
                  )}
                  {bake.ambient_temp_f && (
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer size={13} className="text-stone-600" />
                      <span className="text-stone-400">Room temp:</span>
                      <span className="text-stone-200">
                        {bake.ambient_temp_f}°C
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {editing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 max-w-2xl"
            >
              <div>
                <label className="text-xs text-stone-500 mb-1 block">
                  What went well
                </label>
                <textarea
                  value={editWell}
                  onChange={(e) => setEditWell(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-stone-300 placeholder:text-stone-600 resize-none h-20 focus:outline-none focus:border-stone-700"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">
                  What to improve
                </label>
                <textarea
                  value={editImprove}
                  onChange={(e) => setEditImprove(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-stone-300 placeholder:text-stone-600 resize-none h-20 focus:outline-none focus:border-stone-700"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">
                  Modifications
                </label>
                <textarea
                  value={editMods}
                  onChange={(e) => setEditMods(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-stone-300 placeholder:text-stone-600 resize-none h-20 focus:outline-none focus:border-stone-700"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">
                  Overall notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-stone-300 placeholder:text-stone-600 resize-none h-20 focus:outline-none focus:border-stone-700"
                />
              </div>
              <button
                type="button"
                onClick={saveEdits}
                className="w-full md:w-auto md:px-12 bg-amber-500 text-stone-950 font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
              >
                <Save size={14} /> Save Changes
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bake.what_went_well && (
                <div>
                  <h3 className="text-xs font-medium text-emerald-500 uppercase tracking-wider mb-2">
                    What went well
                  </h3>
                  <p className="text-sm text-stone-300 bg-stone-900 rounded-xl p-3 border border-stone-800/50 leading-relaxed">
                    {bake.what_went_well}
                  </p>
                </div>
              )}

              {bake.what_to_improve && (
                <div>
                  <h3 className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-2">
                    To improve
                  </h3>
                  <p className="text-sm text-stone-300 bg-stone-900 rounded-xl p-3 border border-stone-800/50 leading-relaxed">
                    {bake.what_to_improve}
                  </p>
                </div>
              )}

              {bake.modifications && (
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Modifications
                  </h3>
                  <p className="text-sm text-stone-300 bg-stone-900 rounded-xl p-3 border border-stone-800/50 leading-relaxed">
                    {bake.modifications}
                  </p>
                </div>
              )}

              {bake.overall_notes && (
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-stone-300 bg-stone-900 rounded-xl p-3 border border-stone-800/50 leading-relaxed">
                    {bake.overall_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step Logs */}
          {stepLogs.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                Step Log
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {stepLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-stone-900 rounded-xl p-3 border border-stone-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-stone-200 font-medium">
                        {log.step_title}
                      </p>
                      {log.completed_at && (
                        <p className="text-[10px] text-stone-600">
                          {format(new Date(log.completed_at), "h:mm a")}
                        </p>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-stone-400 mt-1">{log.notes}</p>
                    )}
                    {log.temperature_reading && (
                      <p className="text-xs text-amber-500/70 mt-1">
                        🌡️ {log.temperature_reading}°C
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
