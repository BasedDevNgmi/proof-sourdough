"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Camera,
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
import confetti from "canvas-confetti";
import { getRecipeById, type Recipe, type Ingredient } from "@/data/recipes";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Timer } from "@/components/ui/timer";
import { ErrorBoundary } from "@/components/error-boundary";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { requestWakeLock, releaseWakeLock, reacquireOnVisibility } from "@/lib/wake-lock";
import { trackEvent } from "@/lib/analytics";
import { GlossaryText } from "@/components/ui/glossary-text";
import { useBeginnerMode } from "@/hooks/use-beginner-mode";
import { getGuideForStep } from "@/data/dough-guides";

type StepIngredientGroup = { group: string; label: string; items: Ingredient[] };

function getStepIngredients(recipe: Recipe, stepIndex: number): StepIngredientGroup[] {
  const step = recipe.steps[stepIndex];
  const title = step.title.toLowerCase();
  const fullText = `${step.title} ${step.instructions}`.toLowerCase();

  const results: StepIngredientGroup[] = [];
  const coveredTerms = new Set<string>();

  const groups: { key: keyof Recipe["ingredients"]; label: string; titleOnly: boolean; titlePattern: RegExp }[] = [
    { key: "levain", label: "Levain", titleOnly: true, titlePattern: /\blevain\b|\bstarter\b/i },
    { key: "filling", label: "Filling", titleOnly: false, titlePattern: /\bfill/i },
    { key: "topping", label: "Topping", titleOnly: false, titlePattern: /\btopp/i },
    { key: "additions", label: "Additions", titleOnly: false, titlePattern: /\baddition/i },
    { key: "main", label: "Dough", titleOnly: false, titlePattern: /^$/ },
  ];

  for (const { key, label, titleOnly, titlePattern } of groups) {
    const items = recipe.ingredients[key];
    if (!items?.length) continue;

    const titleMatch = titlePattern.test(title);

    if (titleMatch) {
      results.push({ group: key, label, items });
      items.forEach((ing) => extractTerms(ing.name).forEach((t) => coveredTerms.add(t)));
      coveredTerms.add(key);
      continue;
    }

    if (titleOnly) continue;

    const matched = items.filter((ing) => {
      const terms = extractTerms(ing.name);
      if (terms.some((t) => coveredTerms.has(t))) return false;
      return isIngredientInText(ing.name, fullText);
    });

    if (matched.length > 0) {
      results.push({ group: key, label, items: matched });
      matched.forEach((ing) => extractTerms(ing.name).forEach((t) => coveredTerms.add(t)));
    }
  }

  return results;
}

function extractTerms(name: string): string[] {
  const cleaned = name.toLowerCase().replace(/\([^)]*\)/g, "").replace(/~[\d.]+%\s*/g, "").replace(/[,;]/g, "").trim();
  const skip = new Set(["ripe", "fine", "coarse", "fresh", "dried", "unsalted", "melted", "room", "temperature", "large", "small", "medium", "sea", "warm", "cold", "hot", "and", "for", "the", "with"]);
  return cleaned.split(/\s+/).filter((w) => !skip.has(w) && w.length > 2);
}

function isIngredientInText(name: string, text: string): boolean {
  const cleaned = name.toLowerCase().replace(/\([^)]*\)/g, "").replace(/~[\d.]+%\s*/g, "").replace(/[,;]/g, "").trim();
  const skip = new Set(["ripe", "fine", "coarse", "fresh", "dried", "unsalted", "melted", "room", "temperature", "large", "small", "medium", "sea", "warm", "cold", "hot", "and", "for", "the", "with"]);
  const words = cleaned.split(/\s+/).filter((w) => !skip.has(w) && w.length > 2);

  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}s?\\b`, "i").test(text)) return true;
  }
  return false;
}

export default function BakeSessionPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
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
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const { beginner, toggle: toggleBeginner } = useBeginnerMode();

  const [justCompletedStep, setJustCompletedStep] = useState<number | null>(null);
  const [stepPhotos, setStepPhotos] = useState<Record<number, string[]>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const tipRotations = useRef<Record<string, number>>({});

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
  const [doughTemp, setDoughTemp] = useState("");
  const [humidity, setHumidity] = useState("");
  const [starterHydration, setStarterHydration] = useState("");
  const [starterNotes, setStarterNotes] = useState("");
  const [bulkHours, setBulkHours] = useState("");
  const [proofHours, setProofHours] = useState("");
  const [bakeTimeMin, setBakeTimeMin] = useState("");
  const [bakeTempC, setBakeTempC] = useState("");
  const [saving, setSaving] = useState(false);
  const startingSession = useRef(false);

  function getTipRotation(key: string): number {
    if (!tipRotations.current[key]) {
      tipRotations.current[key] = -0.3 - Math.random() * 0.7;
    }
    return tipRotations.current[key];
  }

  const sessionStorageKey = `proof-bake-${recipeId}`;

  useEffect(() => {
    const state = safeGetJSON<{
      currentStep?: number;
      completedSteps?: number[];
      stepNotes?: Record<number, string>;
      stepTemps?: Record<number, string>;
      sessionId?: string;
    }>(sessionStorageKey, {});
    if (state.currentStep !== undefined) setCurrentStep(state.currentStep);
    if (state.completedSteps) setCompletedSteps(new Set(state.completedSteps));
    if (state.stepNotes) setStepNotes(state.stepNotes);
    if (state.stepTemps) setStepTemps(state.stepTemps);
    if (state.sessionId && !sessionId) setSessionId(state.sessionId);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    safeSetJSON(sessionStorageKey, {
      sessionId,
      currentStep,
      completedSteps: [...completedSteps],
      stepNotes,
      stepTemps,
    });
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
    if (startingSession.current) return;
    startingSession.current = true;
    try {
      const { data } = await supabase
        .from("bake_sessions")
        .insert({
          recipe_id: recipeId,
          book_id: recipe?.bookId || "the-perfect-loaf",
          status: "in-progress",
          user_id: user?.id,
        })
        .select()
        .single();

      if (data) {
        setSessionId(data.id);
        window.history.replaceState(null, "", `?session=${data.id}`);
        trackEvent("bake_started", { recipe_id: recipeId, recipe_title: recipe?.title });
      }
    } finally {
      startingSession.current = false;
    }
  }

  const markStepComplete = useCallback(
    async (stepNum: number) => {
      setCompletedSteps((prev) => new Set([...prev, stepNum]));

      if (sessionId) {
        await supabase.from("bake_step_logs").insert({
          session_id: sessionId,
          user_id: user?.id,
          step_number: stepNum,
          step_title: recipe?.steps[stepNum]?.title || `Step ${stepNum + 1}`,
          completed_at: new Date().toISOString(),
          notes: stepNotes[stepNum] || null,
          temperature_reading: stepTemps[stepNum]
            ? parseFloat(stepTemps[stepNum])
            : null,
        });
        trackEvent("bake_step_completed", { step: stepNum, recipe_id: recipeId });
      }
    },
    [sessionId, recipe, stepNotes, stepTemps, recipeId]
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
        dough_temp_f: doughTemp ? parseFloat(doughTemp) : null,
        humidity_percent: humidity ? parseFloat(humidity) : null,
        starter_hydration: starterHydration || null,
        starter_notes: starterNotes || null,
        bulk_fermentation_hours: bulkHours ? parseFloat(bulkHours) : null,
        proof_hours: proofHours ? parseFloat(proofHours) : null,
        bake_time_minutes: bakeTimeMin ? parseFloat(bakeTimeMin) : null,
        bake_temp_f: bakeTempC ? parseFloat(bakeTempC) : null,
      })
      .eq("id", sessionId);

    setSaving(false);
    cleanupSession();
    trackEvent("bake_completed", { recipe_id: recipeId, overall_rating: overallRating });

    // Flour confetti celebration
    confetti({
      particleCount: 80,
      spread: 70,
      colors: ["#fef3c7", "#f5f5f4", "#d6d3d1", "#f59e0b"],
    });

    // Delay navigation so animation plays
    await new Promise((resolve) => setTimeout(resolve, 800));
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

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !sessionId || !user) return;
    setUploadingPhoto(true);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${sessionId}/step-${currentStep}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("bake-photos")
      .upload(path, file, { contentType: file.type });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("bake-photos").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      await supabase.from("bake_photos").insert({
        session_id: sessionId,
        user_id: user.id,
        photo_url: publicUrl,
        stage: recipe?.steps[currentStep]?.title || `Step ${currentStep + 1}`,
      });

      setStepPhotos((prev) => ({
        ...prev,
        [currentStep]: [...(prev[currentStep] || []), publicUrl],
      }));
      trackEvent("bake_photo_added", { step: currentStep, recipe_id: recipeId });
    }
    setUploadingPhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>Recipe not found</p>
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
    if (total > 0) return total;
    return null;
  }

  function scaleWeight(weight: string): string {
    if (multiplier === 1) return weight;
    const match = weight.match(/^(\d+(?:\.\d+)?)\s*(g|ml|oz)?$/i);
    if (!match) return weight;
    const scaled = Math.round(parseFloat(match[1]) * multiplier);
    return `${scaled}${match[2] || ""}`;
  }

  const timerMinutes = parseTimerMinutes(step?.duration);

  return (
    <ErrorBoundary variant="bake">
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="flex-1 flex flex-col lg:flex-row w-full">

        {/* Desktop step sidebar */}
        <aside
          className="hidden lg:flex flex-col w-72 shrink-0 border-r overflow-y-auto"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="px-5 pt-8 pb-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold" style={{ color: "var(--text)" }}>
              {recipe.title}
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {completedSteps.size} of {totalSteps} steps done
            </p>
            <div className="h-1 rounded-full overflow-hidden mt-3" style={{ background: "var(--card-hover)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: "var(--text-faint)" }}>Scale</span>
              {[0.5, 1, 1.5, 2, 3, 4].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMultiplier(m)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium transition-all"
                  style={{
                    background: multiplier === m ? "var(--accent)" : "transparent",
                    color: multiplier === m ? "var(--bg)" : "var(--text-faint)",
                  }}
                >
                  {m}x
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleBeginner}
              className="flex items-center gap-1.5 mt-2 text-[10px] transition-colors"
              style={{ color: beginner ? "var(--accent)" : "var(--text-faint)" }}
            >
              <div
                className="w-6 h-3.5 rounded-full relative transition-colors"
                style={{ background: beginner ? "var(--accent)" : "var(--card-hover)" }}
              >
                <div
                  className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: "var(--bg)",
                    left: beginner ? 12 : 2,
                  }}
                />
              </div>
              Beginner mode
            </button>
          </div>
          <nav className="flex-1 px-3 pb-4 space-y-0.5">
            {recipe.steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
                style={{
                  background: i === currentStep ? "var(--card)" : "transparent",
                  border: i === currentStep ? "1px solid var(--border-subtle)" : "1px solid transparent",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                  style={
                    completedSteps.has(i)
                      ? { background: "var(--success, #10b981)", color: "var(--bg)" }
                      : i === currentStep
                        ? { background: "var(--accent)", color: "var(--bg)" }
                        : { background: "var(--card-hover)", color: "var(--text-muted)" }
                  }
                >
                  {completedSteps.has(i) ? <Check size={12} /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: i === currentStep ? "var(--text)" : "var(--text-secondary)" }}
                  >
                    {s.title}
                  </p>
                  {s.duration && (
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                      {s.duration}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </nav>
          {(() => {
            const sidebarIngs = getStepIngredients(recipe, currentStep);
            if (sidebarIngs.length === 0) return null;
            return (
              <div className="px-3 pb-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
                  🧂 This step
                </p>
                <div className="space-y-2.5">
                  {sidebarIngs.map(({ group, label, items }) => (
                    <div key={group}>
                      <p className="text-[9px] font-semibold uppercase tracking-wider mb-1 px-1" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </p>
                      <div className="space-y-0.5">
                        {items.map((ing) => {
                          const key = `${group}-${ing.name}`;
                          const checked = checkedIngredients.has(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setCheckedIngredients((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(key)) next.delete(key);
                                  else next.add(key);
                                  return next;
                                });
                              }}
                              className="w-full flex items-center gap-2 text-left px-1 py-1 rounded-lg transition-colors hover:bg-[var(--card-hover-subtle)]"
                            >
                              <div
                                className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                                style={{
                                  borderColor: checked ? "var(--accent)" : "var(--border-subtle)",
                                  background: checked ? "var(--accent)" : "transparent",
                                }}
                              >
                                {checked && <Check size={8} style={{ color: "var(--bg)" }} />}
                              </div>
                              <span
                                className="text-[11px] flex-1 truncate"
                                style={{
                                  color: "var(--text-secondary)",
                                  opacity: checked ? 0.4 : 1,
                                  textDecoration: checked ? "line-through" : "none",
                                }}
                              >
                                {ing.name}
                              </span>
                              <span
                                className="text-[10px] tabular-nums shrink-0"
                                style={{ color: "var(--text-muted)", opacity: checked ? 0.4 : 1 }}
                              >
                                {scaleWeight(ing.weight)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="px-5 pb-6 space-y-2">
            <button
              type="button"
              onClick={() => setShowFinishModal(true)}
              className="w-full text-xs font-semibold py-2.5 rounded-xl transition-colors"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              Finish Bake
            </button>
            <button
              type="button"
              onClick={abandonBake}
              className="w-full text-[11px] py-1.5"
              style={{ color: "var(--text-faint)" }}
            >
              Abandon
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full lg:max-w-none">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between px-4 pt-14 pb-3 lg:hidden">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="transition-colors p-1"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{recipe.title}</p>
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFinishModal(true)}
              className="text-xs font-medium px-2 py-1"
              style={{ color: "var(--accent)" }}
            >
              Finish
            </button>
          </div>

          {/* Mobile progress bar */}
          <div className="px-4 mb-4 lg:hidden">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--card-hover)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 px-5 lg:px-10 lg:pt-10">
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
                <div className="mb-4 lg:mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative w-8 h-8 lg:w-10 lg:h-10">
                      <AnimatePresence>
                        {justCompletedStep === currentStep && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{ background: "var(--accent)" }}
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        )}
                      </AnimatePresence>
                      <div
                        className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-sm lg:text-base font-semibold relative"
                        style={
                          completedSteps.has(currentStep)
                            ? { background: "var(--success, #10b981)", color: "var(--bg)" }
                            : { background: "var(--accent-muted, rgba(217,119,6,0.15))", color: "var(--accent)" }
                        }
                      >
                        <AnimatePresence mode="wait">
                          {completedSteps.has(currentStep) ? (
                            <motion.span
                              key="check"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check size={16} style={{ color: justCompletedStep === currentStep ? "var(--accent)" : "var(--bg)" }} />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="number"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              {step.step}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <h2 className="font-[family-name:var(--font-playfair)] text-xl lg:text-2xl font-semibold" style={{ color: "var(--text)" }}>
                      {step.title}
                    </h2>
                  </div>
                  {step.duration && (
                    <p className="text-xs flex items-center gap-1 ml-10 lg:ml-12" style={{ color: "var(--text-muted)" }}>
                      <Clock size={12} /> {step.duration}
                    </p>
                  )}
                </div>

                {/* Instructions + timer side by side on desktop */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                  <div>
                    <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}>
                      <p className="text-sm lg:text-base lg:leading-7 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        <GlossaryText text={step.instructions} />
                      </p>
                      {step.temperature && (
                        <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: "var(--accent)", opacity: 0.8 }}>
                          <Thermometer size={12} /> Target: {step.temperature}
                        </p>
                      )}
                    </div>

                    {beginner && (() => {
                      const guide = getGuideForStep(step.title, step.instructions);
                      if (!guide) return null;
                      return (
                        <div
                          className="rounded-xl p-3 mb-4 space-y-2"
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--accent-border, rgba(217,119,6,0.15))",
                          }}
                        >
                          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--accent)" }}>
                            What to look for
                          </p>
                          <div className="space-y-1.5">
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              <span style={{ color: "var(--success, #10b981)", fontWeight: 600 }}>Ready: </span>
                              {guide.ready}
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              <span style={{ color: "var(--accent)", fontWeight: 600 }}>Not yet: </span>
                              {guide.notReady}
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Overdone: </span>
                              {guide.overDone}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {step.tip && (
                      <div
                        className="rounded-xl p-3 mb-4"
                        style={{
                          background: "var(--accent-muted, rgba(217,119,6,0.05))",
                          border: "1px solid var(--accent-border, rgba(217,119,6,0.1))",
                          transform: `rotate(${getTipRotation(`bake-step-${currentStep}`)}deg)`,
                        }}
                      >
                        <p
                          className="text-base flex items-start gap-2"
                          style={{
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-caveat)",
                          }}
                        >
                          <Lightbulb size={14} className="mt-1 shrink-0" style={{ color: "var(--accent)" }} />
                          {step.tip}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    {timerMinutes && (
                      <div className="flex justify-center mb-4 lg:mb-6">
                        <Timer durationMinutes={timerMinutes} label={step.title} storageKey={`proof-timer-${recipeId}-step-${currentStep}`} />
                      </div>
                    )}

                    {(() => {
                      const stepIngs = getStepIngredients(recipe, currentStep);
                      if (stepIngs.length === 0) return null;
                      return (
                        <div
                          className="rounded-2xl p-4 space-y-3 mb-4"
                          style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}
                        >
                          {stepIngs.map(({ group, label, items }) => (
                            <div key={group}>
                              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                                {label}
                              </p>
                              <div className="space-y-1.5">
                                {items.map((ing) => {
                                  const key = `${group}-${ing.name}`;
                                  const checked = checkedIngredients.has(key);
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => {
                                        setCheckedIngredients((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(key)) next.delete(key);
                                          else next.add(key);
                                          return next;
                                        });
                                      }}
                                      className="w-full flex items-center gap-2.5 text-left py-1"
                                    >
                                      <div
                                        className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                                        style={{
                                          borderColor: checked ? "var(--accent)" : "var(--border-subtle)",
                                          background: checked ? "var(--accent)" : "transparent",
                                        }}
                                      >
                                        {checked && <Check size={10} style={{ color: "var(--bg)" }} />}
                                      </div>
                                      <span
                                        className="text-sm flex-1 transition-opacity"
                                        style={{
                                          color: "var(--text-secondary)",
                                          opacity: checked ? 0.4 : 1,
                                          textDecoration: checked ? "line-through" : "none",
                                        }}
                                      >
                                        {ing.name}
                                      </span>
                                      <span
                                        className="text-xs tabular-nums shrink-0"
                                        style={{ color: "var(--text-muted)", opacity: checked ? 0.4 : 1 }}
                                      >
                                        {scaleWeight(ing.weight)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {showNoteInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mb-4"
                      >
                        <textarea
                          value={stepNotes[currentStep] || ""}
                          onChange={(e) =>
                            setStepNotes((prev) => ({ ...prev, [currentStep]: e.target.value }))
                          }
                          placeholder="How does the dough look? Any observations..."
                          className="w-full rounded-xl p-3 text-sm resize-none h-20 focus:outline-none"
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)",
                          }}
                        />
                      </motion.div>
                    )}

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
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "" || (Number(v) >= 0 && Number(v) <= 500)) {
                                setStepTemps((prev) => ({ ...prev, [currentStep]: v }));
                              }
                            }}
                            min={0}
                            max={500}
                            placeholder="Temp"
                            className="w-24 rounded-xl px-3 py-2 text-sm focus:outline-none"
                            style={{
                              background: "var(--card)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-secondary)",
                            }}
                          />
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>°C</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Step Photos */}
                {stepPhotos[currentStep]?.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {stepPhotos[currentStep].map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Step ${currentStep + 1} photo ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-xl shrink-0"
                        style={{ border: "1px solid var(--border-subtle)" }}
                      />
                    ))}
                  </div>
                )}

                {/* Action Buttons — desktop only (mobile uses floating bar) */}
                <div className="hidden lg:flex gap-2 mb-4 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={
                      showNoteInput || stepNotes[currentStep]
                        ? { background: "var(--card-hover)", color: "var(--text)" }
                        : { background: "var(--card-hover-subtle, rgba(120,113,108,0.15))", color: "var(--text-muted)" }
                    }
                  >
                    <MessageSquare size={12} /> Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTempInput(!showTempInput)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={
                      showTempInput || stepTemps[currentStep]
                        ? { background: "var(--card-hover)", color: "var(--text)" }
                        : { background: "var(--card-hover-subtle, rgba(120,113,108,0.15))", color: "var(--text-muted)" }
                    }
                  >
                    <Thermometer size={12} /> Temp
                  </button>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    style={
                      stepPhotos[currentStep]?.length
                        ? { background: "var(--card-hover)", color: "var(--text)" }
                        : { background: "var(--card-hover-subtle, rgba(120,113,108,0.15))", color: "var(--text-muted)" }
                    }
                  >
                    <Camera size={12} /> {uploadingPhoto ? "..." : "Photo"}
                  </button>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Navigation — mobile + desktop inline */}
          <div className="px-5 lg:px-10 py-4 pb-safe lg:pb-6 flex items-center gap-3 max-w-2xl lg:max-w-none">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-30 transition-colors"
              style={{ background: "var(--card-hover)" }}
            >
              <ChevronLeft size={20} style={{ color: "var(--text-secondary)" }} />
            </button>

            {!completedSteps.has(currentStep) ? (
              <button
                type="button"
                onClick={() => {
                  markStepComplete(currentStep);
                  setJustCompletedStep(currentStep);
                  setTimeout(() => {
                    setJustCompletedStep(null);
                    if (currentStep < totalSteps - 1) {
                      setCurrentStep(currentStep + 1);
                    }
                  }, 500);
                }}
                className="flex-1 h-12 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors lg:max-w-md"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
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
                className="flex-1 h-12 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors lg:max-w-md"
                style={{ background: "var(--card-hover)", color: "var(--text-secondary)" }}
              >
                {currentStep === totalSteps - 1 ? "Finish Bake" : "Next Step"}
                <ChevronRight size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
              disabled={currentStep === totalSteps - 1}
              className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-30 transition-colors"
              style={{ background: "var(--card-hover)" }}
            >
              <ChevronRight size={20} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* Step Dots — mobile only */}
          <div className="flex justify-center gap-1 pb-4 lg:hidden">
            {recipe.steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentStep ? "w-4" : "w-1.5"
                }`}
                style={{
                  background: i === currentStep
                    ? "var(--accent)"
                    : completedSteps.has(i)
                    ? "var(--success, #10b981)"
                    : "var(--text-ghost, var(--text-faint))",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile floating action bar */}
      <div
        className="fixed left-0 right-0 z-40 flex items-center justify-center gap-3 px-4 py-2.5 lg:hidden"
        style={{
          bottom: "max(80px, calc(env(safe-area-inset-bottom) + 76px))",
          background: "var(--bg)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <button
          type="button"
          onClick={() => setShowNoteInput(!showNoteInput)}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors"
          style={
            showNoteInput || stepNotes[currentStep]
              ? { background: "var(--card-hover)", color: "var(--text)" }
              : { color: "var(--text-muted)" }
          }
        >
          <MessageSquare size={18} />
          <span className="text-[9px] font-medium">Note</span>
        </button>
        <button
          type="button"
          onClick={() => setShowTempInput(!showTempInput)}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors"
          style={
            showTempInput || stepTemps[currentStep]
              ? { background: "var(--card-hover)", color: "var(--text)" }
              : { color: "var(--text-muted)" }
          }
        >
          <Thermometer size={18} />
          <span className="text-[9px] font-medium">Temp</span>
        </button>
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={uploadingPhoto}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors disabled:opacity-50"
          style={
            stepPhotos[currentStep]?.length
              ? { background: "var(--card-hover)", color: "var(--text)" }
              : { color: "var(--text-muted)" }
          }
        >
          <Camera size={18} />
          <span className="text-[9px] font-medium">{uploadingPhoto ? "..." : "Photo"}</span>
        </button>
        {multiplier === 1 && (
          <div className="flex items-center gap-1 ml-auto">
            {[1, 1.5, 2].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMultiplier(m)}
                className="px-2 py-1 rounded text-[10px] font-medium"
                style={{
                  background: multiplier === m ? "var(--accent)" : "transparent",
                  color: multiplier === m ? "var(--bg)" : "var(--text-faint)",
                }}
              >
                {m}x
              </button>
            ))}
          </div>
        )}
        {multiplier !== 1 && (
          <button
            type="button"
            onClick={() => setMultiplier(1)}
            className="ml-auto px-2 py-1 rounded text-[10px] font-medium"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            {multiplier}x
          </button>
        )}
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
              className="w-full lg:max-w-2xl lg:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto"
              style={{ background: "var(--card)" }}
            >
              <div className="sticky top-0 px-5 pt-4 pb-2 flex items-center justify-between" style={{ background: "var(--card)", borderBottom: "1px solid var(--border-subtle)" }}>
                <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold" style={{ color: "var(--text)" }}>
                  Finish Bake
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="p-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5">
                {/* Ratings */}
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    Rate Your Bake
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(beginner
                      ? [{ label: "How'd it go?", value: overallRating, set: setOverallRating }]
                      : [
                          { label: "Overall", value: overallRating, set: setOverallRating },
                          { label: "Crumb", value: crumbRating, set: setCrumbRating },
                          { label: "Crust", value: crustRating, set: setCrustRating },
                          { label: "Flavor", value: flavorRating, set: setFlavorRating },
                        ]
                    ).map(({ label, value, set }) => (
                      <div key={label} className="rounded-xl p-3" style={{ background: "var(--card-hover-subtle, rgba(120,113,108,0.15))" }}>
                        <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.button
                              key={star}
                              type="button"
                              onClick={() => {
                                navigator.vibrate?.(10);
                                set(star);
                              }}
                              whileTap={{ scale: 1.3 }}
                              transition={{ type: "spring", stiffness: 500, damping: 15 }}
                              className="text-lg"
                            >
                              {star <= value ? "★" : "☆"}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    Notes
                  </h3>
                  <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        What went well?
                      </label>
                      <textarea
                        value={whatWentWell}
                        onChange={(e) => setWhatWentWell(e.target.value)}
                        placeholder="Great oven spring, nice ear..."
                        className="w-full rounded-xl p-3 text-sm resize-none h-16 focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        What to improve?
                      </label>
                      <textarea
                        value={whatToImprove}
                        onChange={(e) => setWhatToImprove(e.target.value)}
                        placeholder="Shape was a bit loose, need more tension..."
                        className="w-full rounded-xl p-3 text-sm resize-none h-16 focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Modifications from recipe
                      </label>
                      <textarea
                        value={modifications}
                        onChange={(e) => setModifications(e.target.value)}
                        placeholder="Used 80% hydration instead of 75%..."
                        className="w-full rounded-xl p-3 text-sm resize-none h-16 focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Overall notes
                      </label>
                      <textarea
                        value={overallNotes}
                        onChange={(e) => setOverallNotes(e.target.value)}
                        placeholder="Any other observations..."
                        className="w-full rounded-xl p-3 text-sm resize-none h-16 focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Environment */}
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    Environment
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Flour brand
                      </label>
                      <input
                        type="text"
                        value={flourBrand}
                        onChange={(e) => setFlourBrand(e.target.value)}
                        maxLength={100}
                        placeholder="King Arthur..."
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Room temp (°C)
                      </label>
                      <input
                        type="number"
                        value={ambientTemp}
                        min={-10}
                        max={60}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || (Number(v) >= -10 && Number(v) <= 60)) {
                            setAmbientTemp(v);
                          }
                        }}
                        placeholder="22"
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Dough temp (°C)
                      </label>
                      <input
                        type="number"
                        value={doughTemp}
                        min={0}
                        max={60}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || (Number(v) >= 0 && Number(v) <= 60)) setDoughTemp(v);
                        }}
                        placeholder="25"
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Humidity (%)
                      </label>
                      <input
                        type="number"
                        value={humidity}
                        min={0}
                        max={100}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || (Number(v) >= 0 && Number(v) <= 100)) setHumidity(v);
                        }}
                        placeholder="65"
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Starter — hidden in beginner mode */}
                {!beginner && <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    Starter
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Hydration
                      </label>
                      <input
                        type="text"
                        value={starterHydration}
                        onChange={(e) => setStarterHydration(e.target.value)}
                        maxLength={20}
                        placeholder="100%"
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Starter notes
                      </label>
                      <input
                        type="text"
                        value={starterNotes}
                        onChange={(e) => setStarterNotes(e.target.value)}
                        maxLength={200}
                        placeholder="Peaked at 6hrs, doubled..."
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                  </div>
                </div>}

                {/* Timing — hidden in beginner mode */}
                {!beginner && <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    Timing
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Bulk ferment (hrs)
                      </label>
                      <input
                        type="number"
                        value={bulkHours}
                        min={0}
                        max={48}
                        step={0.5}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || (Number(v) >= 0 && Number(v) <= 48)) setBulkHours(v);
                        }}
                        placeholder="4"
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Proof time (hrs)
                      </label>
                      <input
                        type="number"
                        value={proofHours}
                        min={0}
                        max={48}
                        step={0.5}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || (Number(v) >= 0 && Number(v) <= 48)) setProofHours(v);
                        }}
                        placeholder="12"
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Bake time (min)
                      </label>
                      <input
                        type="number"
                        value={bakeTimeMin}
                        min={0}
                        max={180}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || (Number(v) >= 0 && Number(v) <= 180)) setBakeTimeMin(v);
                        }}
                        placeholder="45"
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                        Oven temp (°C)
                      </label>
                      <input
                        type="number"
                        value={bakeTempC}
                        min={0}
                        max={350}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || (Number(v) >= 0 && Number(v) <= 350)) setBakeTempC(v);
                        }}
                        placeholder="230"
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{
                          background: "var(--card-hover-subtle, rgba(120,113,108,0.15))",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>
                  </div>
                </div>}

                {/* Actions */}
                <div className="space-y-2 pb-safe">
                  <button
                    type="button"
                    onClick={finishBake}
                    disabled={saving}
                    className="w-full font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    style={{ background: "var(--accent)", color: "var(--bg)" }}
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save & Complete"}
                  </button>
                  <button
                    type="button"
                    onClick={abandonBake}
                    className="w-full text-sm py-2"
                    style={{ color: "var(--text-muted)" }}
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
    </ErrorBoundary>
  );
}
