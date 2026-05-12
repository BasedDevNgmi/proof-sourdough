"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  MessageSquare,
  Save,
  X,
  Thermometer,
} from "lucide-react";
import { getRecipeById } from "@/data/recipes";
import { supabase } from "@/lib/supabase";
import { Timer } from "@/components/ui/timer";
import { requestWakeLock, releaseWakeLock, reacquireOnVisibility } from "@/lib/wake-lock";

export default function BakeSessionPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipe = getRecipeById(recipeId);

  const [sessionId, setSessionId] = useState<string | null>(
    searchParams.get("session")
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepNotes, setStepNotes] = useState<Record<number, string>>({});
  const [stepTemps, setStepTemps] = useState<Record<number, string>>({});
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showTempInput, setShowTempInput] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [crumbRating, setCrumbRating] = useState(0);
  const [crustRating, setCrustRating] = useState(0);
  const [flavorRating, setFlavorRating] = useState(0);
  const [whatWentWell, setWhatWentWell] = useState("");
  const [whatToImprove, setWhatToImprove] = useState("");
  const [overallNotes, setOverallNotes] = useState("");
  const [modifications, setModifications] = useState("");
  const [flourBrand, setFlourBrand] = useState("");
  const [ambientTemp, setAmbientTemp] = useState("");
  const [saving, setSaving] = useState(false);

  const sessionStorageKey = `proof-bake-${recipeId}`;

  // Restore session state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(sessionStorageKey);
    if (stored) {
      try {
        const state = JSON.parse(stored);
        if (state.currentStep !== undefined) setCurrentStep(state.currentStep);
        if (state.completedSteps) setCompletedSteps(new Set(state.completedSteps));
        if (state.stepNotes) setStepNotes(state.stepNotes);
        if (state.stepTemps) setStepTemps(state.stepTemps);
        if (state.sessionId && !sessionId) setSessionId(state.sessionId);
      } catch {
        localStorage.removeItem(sessionStorageKey);
      }
    }
  }, []);

  // Persist session state to localStorage on changes
  useEffect(() => {
    if (!sessionId) return;
    const state = {
      sessionId,
      currentStep,
      completedSteps: [...completedSteps],
      stepNotes,
      stepTemps,
    };
    localStorage.setItem(sessionStorageKey, JSON.stringify(state));
  }, [sessionId, currentStep, completedSteps, stepNotes, stepTemps, sessionStorageKey]);

  // Wake lock — keep screen on during bake
  useEffect(() => {
    requestWakeLock();
    const cleanup = reacquireOnVisibility();
    return () => {
      releaseWakeLock();
      cleanup();
    };
  }, []);

  // Warn before leaving mid-bake
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (completedSteps.size < (recipe?.steps.length || 0)) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [completedSteps, recipe]);

  useEffect(() => {
    if (!sessionId && recipe) {
      startSession();
    }
  }, [recipe]);

  async function startSession() {
    const { data } = await supabase
      .from("bake_sessions")
      .insert({
        recipe_id: recipeId,
        book_id: recipe?.bookId || "the-perfect-loaf",
        status: "in-progress",
      })
      .select()
      .single();

    if (data) {
      setSessionId(data.id);
      window.history.replaceState(null, "", `?session=${data.id}`);
    }
  }

  const markStepComplete = useCallback(
    async (stepNum: number) => {
      setCompletedSteps((prev) => new Set([...prev, stepNum]));

      if (sessionId) {
        await supabase.from("bake_step_logs").insert({
          session_id: sessionId,
          step_number: stepNum,
          step_title: recipe?.steps[stepNum]?.title || `Step ${stepNum + 1}`,
          completed_at: new Date().toISOString(),
          notes: stepNotes[stepNum] || null,
          temperature_reading: stepTemps[stepNum]
            ? parseFloat(stepTemps[stepNum])
            : null,
        });
      }
    },
    [sessionId, recipe, stepNotes, stepTemps]
  );

  async function finishBake() {
    if (!sessionId) return;
    setSaving(true);

    await supabase
      .from("bake_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        overall_rating: overallRating || null,
        crumb_rating: crumbRating || null,
        crust_rating: crustRating || null,
        flavor_rating: flavorRating || null,
        what_went_well: whatWentWell || null,
        what_to_improve: whatToImprove || null,
        overall_notes: overallNotes || null,
        modifications: modifications || null,
        flour_brand: flourBrand || null,
        ambient_temp_f: ambientTemp ? parseFloat(ambientTemp) : null,
      })
      .eq("id", sessionId);

    setSaving(false);
    cleanupSession();
    router.push(`/journal/${sessionId}`);
  }

  function cleanupSession() {
    localStorage.removeItem(sessionStorageKey);
    // Clean up any timer storage for this recipe
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`proof-timer-${recipeId}-`)) {
        localStorage.removeItem(key);
      }
    }
  }

  async function abandonBake() {
    if (!sessionId || !confirm("Abandon this bake? Your progress will be lost.")) return;
    await supabase
      .from("bake_sessions")
      .update({ status: "abandoned", completed_at: new Date().toISOString() })
      .eq("id", sessionId);
    cleanupSession();
    router.push("/");
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Recipe not found</p>
      </div>
    );
  }

  const step = recipe.steps[currentStep];
  const totalSteps = recipe.steps.length;
  const progress = completedSteps.size / totalSteps;

  function parseTimerMinutes(duration?: string): number | null {
    if (!duration) return null;
    const hourMatch = duration.match(/(\d+)\s*h/i);
    const minMatch = duration.match(/(\d+)\s*m/i);
    let total = 0;
    if (hourMatch) total += parseInt(hourMatch[1]) * 60;
    if (minMatch) total += parseInt(minMatch[1]);
    if (total > 0 && total <= 120) return total;
    return null;
  }

  const timerMinutes = parseTimerMinutes(step?.duration);

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col lg:pl-0">
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 pt-14 pb-3 lg:pt-8">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-stone-500 active:text-stone-300 hover:text-stone-300 transition-colors p-1"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-xs text-stone-500 font-medium">{recipe.title}</p>
            <p className="text-[10px] text-stone-600">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFinishModal(true)}
            className="text-xs text-amber-500 font-medium px-2 py-1 active:text-amber-400 hover:text-amber-400"
          >
            Finish
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 mb-4">
          <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 px-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Step Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      completedSteps.has(currentStep)
                        ? "bg-emerald-500 text-stone-950"
                        : "bg-amber-900/30 text-amber-500"
                    }`}
                  >
                    {completedSteps.has(currentStep) ? (
                      <Check size={16} />
                    ) : (
                      step.step
                    )}
                  </div>
                  <h2 className="font-[family-name:var(--font-playfair)] text-xl lg:text-2xl font-semibold text-stone-100">
                    {step.title}
                  </h2>
                </div>
                {step.duration && (
                  <p className="text-xs text-stone-500 flex items-center gap-1 ml-10">
                    <Clock size={12} /> {step.duration}
                  </p>
                )}
              </div>

              {/* Desktop: instructions + timer side by side */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-6">
                <div>
                  {/* Instructions */}
                  <div className="bg-stone-900 rounded-2xl p-4 border border-stone-800/50 mb-4">
                    <p className="text-sm text-stone-300 leading-relaxed">
                      {step.instructions}
                    </p>
                    {step.temperature && (
                      <p className="text-xs text-amber-500/80 mt-3 flex items-center gap-1.5">
                        <Thermometer size={12} /> Target: {step.temperature}
                      </p>
                    )}
                  </div>

                  {/* Tip */}
                  {step.tip && (
                    <div className="bg-amber-900/10 border border-amber-800/20 rounded-xl p-3 mb-4">
                      <p className="text-xs text-stone-400 flex items-start gap-2">
                        <Lightbulb
                          size={14}
                          className="text-amber-500 mt-0.5 shrink-0"
                        />
                        {step.tip}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {/* Timer */}
                  {timerMinutes && (
                    <div className="flex justify-center mb-4">
                      <Timer durationMinutes={timerMinutes} label={step.title} storageKey={`proof-timer-${recipeId}-step-${currentStep}`} />
                    </div>
                  )}

                  {/* Step Notes */}
                  {showNoteInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-4"
                    >
                      <textarea
                        value={stepNotes[currentStep] || ""}
                        onChange={(e) =>
                          setStepNotes((prev) => ({
                            ...prev,
                            [currentStep]: e.target.value,
                          }))
                        }
                        placeholder="How does the dough look? Any observations..."
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-sm text-stone-300 placeholder:text-stone-600 resize-none h-20 focus:outline-none focus:border-stone-700"
                      />
                    </motion.div>
                  )}

                  {/* Temperature Input */}
                  {showTempInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-4"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={stepTemps[currentStep] || ""}
                          onChange={(e) =>
                            setStepTemps((prev) => ({
                              ...prev,
                              [currentStep]: e.target.value,
                            }))
                          }
                          placeholder="Temp"
                          className="w-24 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-300 placeholder:text-stone-600 focus:outline-none focus:border-stone-700"
                        />
                        <span className="text-xs text-stone-500">°C</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    showNoteInput || stepNotes[currentStep]
                      ? "bg-stone-700 text-stone-200"
                      : "bg-stone-800/50 text-stone-500 hover:bg-stone-700/50"
                  }`}
                >
                  <MessageSquare size={12} /> Note
                </button>
                <button
                  type="button"
                  onClick={() => setShowTempInput(!showTempInput)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    showTempInput || stepTemps[currentStep]
                      ? "bg-stone-700 text-stone-200"
                      : "bg-stone-800/50 text-stone-500 hover:bg-stone-700/50"
                  }`}
                >
                  <Thermometer size={12} /> Temp
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="px-5 py-4 pb-safe flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center disabled:opacity-30 active:bg-stone-700 hover:bg-stone-700 transition-colors"
          >
            <ChevronLeft size={20} className="text-stone-300" />
          </button>

          {!completedSteps.has(currentStep) ? (
            <button
              type="button"
              onClick={() => {
                markStepComplete(currentStep);
                if (currentStep < totalSteps - 1) {
                  setCurrentStep(currentStep + 1);
                }
              }}
              className="flex-1 h-12 bg-amber-500 text-stone-950 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 active:bg-amber-600 hover:bg-amber-400 transition-colors"
            >
              <Check size={16} />
              {currentStep === totalSteps - 1 ? "Complete Last Step" : "Done — Next"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (currentStep < totalSteps - 1) {
                  setCurrentStep(currentStep + 1);
                } else {
                  setShowFinishModal(true);
                }
              }}
              className="flex-1 h-12 bg-stone-800 text-stone-300 font-medium text-sm rounded-xl flex items-center justify-center gap-2 active:bg-stone-700 hover:bg-stone-700 transition-colors"
            >
              {currentStep === totalSteps - 1 ? "Finish Bake" : "Next Step"}
              <ChevronRight size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))
            }
            disabled={currentStep === totalSteps - 1}
            className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center disabled:opacity-30 active:bg-stone-700 hover:bg-stone-700 transition-colors"
          >
            <ChevronRight size={20} className="text-stone-300" />
          </button>
        </div>

        {/* Step Dots */}
        <div className="flex justify-center gap-1 pb-4">
          {recipe.steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === currentStep
                  ? "w-4 bg-amber-500"
                  : completedSteps.has(i)
                  ? "bg-emerald-500"
                  : "bg-stone-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Finish Modal */}
      <AnimatePresence>
        {showFinishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end lg:items-center lg:justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFinishModal(false);
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full lg:max-w-2xl lg:rounded-3xl bg-stone-900 rounded-t-3xl max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-stone-900 px-5 pt-4 pb-2 flex items-center justify-between border-b border-stone-800/50">
                <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-stone-100">
                  Finish Bake
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="text-stone-500 p-1 hover:text-stone-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5">
                {/* Ratings */}
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                    Rate Your Bake
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Overall", value: overallRating, set: setOverallRating },
                      { label: "Crumb", value: crumbRating, set: setCrumbRating },
                      { label: "Crust", value: crustRating, set: setCrustRating },
                      { label: "Flavor", value: flavorRating, set: setFlavorRating },
                    ].map(({ label, value, set }) => (
                      <div key={label} className="bg-stone-800/50 rounded-xl p-3">
                        <p className="text-xs text-stone-500 mb-1.5">{label}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => set(star)}
                              className="text-lg active:scale-110 hover:scale-110 transition-transform"
                            >
                              {star <= value ? "★" : "☆"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                    Notes
                  </h3>
                  <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">
                        What went well?
                      </label>
                      <textarea
                        value={whatWentWell}
                        onChange={(e) => setWhatWentWell(e.target.value)}
                        placeholder="Great oven spring, nice ear..."
                        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-xl p-3 text-sm text-stone-300 placeholder:text-stone-600 resize-none h-16 focus:outline-none focus:border-stone-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">
                        What to improve?
                      </label>
                      <textarea
                        value={whatToImprove}
                        onChange={(e) => setWhatToImprove(e.target.value)}
                        placeholder="Shape was a bit loose, need more tension..."
                        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-xl p-3 text-sm text-stone-300 placeholder:text-stone-600 resize-none h-16 focus:outline-none focus:border-stone-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">
                        Modifications from recipe
                      </label>
                      <textarea
                        value={modifications}
                        onChange={(e) => setModifications(e.target.value)}
                        placeholder="Used 80% hydration instead of 75%..."
                        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-xl p-3 text-sm text-stone-300 placeholder:text-stone-600 resize-none h-16 focus:outline-none focus:border-stone-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">
                        Overall notes
                      </label>
                      <textarea
                        value={overallNotes}
                        onChange={(e) => setOverallNotes(e.target.value)}
                        placeholder="Any other observations..."
                        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-xl p-3 text-sm text-stone-300 placeholder:text-stone-600 resize-none h-16 focus:outline-none focus:border-stone-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Environment */}
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                    Environment
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">
                        Flour brand
                      </label>
                      <input
                        type="text"
                        value={flourBrand}
                        onChange={(e) => setFlourBrand(e.target.value)}
                        placeholder="King Arthur..."
                        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-xl px-3 py-2 text-sm text-stone-300 placeholder:text-stone-600 focus:outline-none focus:border-stone-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">
                        Room temp (°C)
                      </label>
                      <input
                        type="number"
                        value={ambientTemp}
                        onChange={(e) => setAmbientTemp(e.target.value)}
                        placeholder="22"
                        className="w-full bg-stone-800/50 border border-stone-700/50 rounded-xl px-3 py-2 text-sm text-stone-300 placeholder:text-stone-600 focus:outline-none focus:border-stone-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pb-safe">
                  <button
                    type="button"
                    onClick={finishBake}
                    disabled={saving}
                    className="w-full bg-amber-500 text-stone-950 font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:bg-amber-600 hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save & Complete"}
                  </button>
                  <button
                    type="button"
                    onClick={abandonBake}
                    className="w-full text-stone-500 text-sm py-2 hover:text-stone-400"
                  >
                    Abandon Bake
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
