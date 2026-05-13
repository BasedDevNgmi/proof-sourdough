"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getRecipeById, type Recipe, type Ingredient } from "@/data/recipes";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { requestWakeLock, releaseWakeLock, reacquireOnVisibility } from "@/lib/wake-lock";
import { trackEvent } from "@/lib/analytics";
import { useBeginnerMode } from "@/hooks/use-beginner-mode";
import { getGuideForStep } from "@/data/dough-guides";

/* ── Inline SVG icons ── */
function IcoBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );
}
function IcoNext() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6l6 6-6 6" />
    </svg>
  );
}
function IcoCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}
function IcoPlay() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 4 20 12 6 20" fill="currentColor" />
    </svg>
  );
}
function IcoPause() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
function IcoReset() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}
function IcoNote() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M16 4v3h3" />
    </svg>
  );
}
function IcoTemp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v11a4 4 0 1 1-4 0V3a2 2 0 1 1 4 0z" />
    </svg>
  );
}
function IcoPhoto() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="14" rx="1" />
      <circle cx="9" cy="12" r="2" />
      <path d="M21 16l-5-5-9 9" />
    </svg>
  );
}

/* ── RingTimer ── */
function RingTimer({ total, remaining, running, hasTimer }: { total: number; remaining: number; running: boolean; hasTimer: boolean }) {
  const r = 72;
  const c = 2 * Math.PI * r;
  const pct = hasTimer ? remaining / total : 1;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} stroke="var(--hairline)" strokeWidth="1" fill="none" />
        <circle cx="90" cy="90" r={r} stroke="var(--accent)" strokeWidth="1.5" fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round" transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset .8s ease' }} />
        <text x="90" y="92" textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: 'var(--serif-display)', fontWeight: 300, fontSize: 42, letterSpacing: '-.02em', fill: 'var(--ink)' }}>
          {hasTimer ? `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : '∞'}
        </text>
        <text x="90" y="118" textAnchor="middle"
          style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase' as const, fill: 'var(--muted)' }}>
          {running ? 'Running' : 'Ready'}
        </text>
      </svg>
    </div>
  );
}

/* ── parseTimerDuration (seconds) ── */
function parseTimerDuration(durStr?: string): number {
  if (!durStr) return 0;
  const s = durStr.toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)\s*(min|hr|hour|h|m)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (m[2].startsWith('hr') || m[2].startsWith('hour') || m[2] === 'h') return Math.round(n * 3600);
  return Math.round(n * 60);
}

/* ── Helper: ingredient matching ── */
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

/* ── Main page component ── */
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
  const [finishStep, setFinishStep] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const { beginner, toggle: toggleBeginner } = useBeginnerMode();

  const [justCompletedStep, setJustCompletedStep] = useState<number | null>(null);
  const [stepPhotos, setStepPhotos] = useState<Record<number, string[]>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  /* ── Timer state ── */
  const timerTotal = parseTimerDuration(recipe?.steps[currentStep]?.duration);
  const hasTimer = timerTotal > 0;
  const [timerRemaining, setTimerRemaining] = useState(timerTotal);
  const [timerRunning, setTimerRunning] = useState(false);

  // Reset timer when step changes
  useEffect(() => {
    const t = parseTimerDuration(recipe?.steps[currentStep]?.duration);
    setTimerRemaining(t);
    setTimerRunning(false);
  }, [currentStep, recipe]);

  // Timer interval
  useEffect(() => {
    if (!timerRunning || timerRemaining <= 0) return;
    const iv = setInterval(() => {
      setTimerRemaining((r) => {
        if (r <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timerRunning, timerRemaining]);

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

  // Wake lock
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

    router.push(`/journal/${sessionId}`);
  }

  function cleanupSession() {
    localStorage.removeItem(sessionStorageKey);
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

  function scaleWeight(weight: string): string {
    if (multiplier === 1) return weight;
    const match = weight.match(/^(\d+(?:\.\d+)?)\s*(g|ml|oz)?$/i);
    if (!match) return weight;
    const scaled = Math.round(parseFloat(match[1]) * multiplier);
    return `${scaled}${match[2] || ""}`;
  }

  function goStep(idx: number) {
    setCurrentStep(Math.max(0, Math.min(idx, totalSteps - 1)));
  }

  if (!recipe) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--serif-display)', fontStyle: 'italic', color: 'var(--muted)' }}>Recipe not found</p>
      </div>
    );
  }

  const step = recipe.steps[currentStep];
  const totalSteps = recipe.steps.length;
  const progress = completedSteps.size / totalSteps;
  const stepIngs = getStepIngredients(recipe, currentStep);
  const guide = beginner ? getGuideForStep(step.title, step.instructions) : null;

  return (
    <ErrorBoundary variant="bake">
      <div className="anim-rise" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px var(--pad-x)',
          borderBottom: '.5px solid var(--hairline)',
        }}>
          <button
            className="btn-link"
            onClick={() => router.push("/")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IcoBack /> Back to formula
          </button>
          <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.12em' }}>
            {sessionId ? `SESSION ${sessionId.slice(0, 8).toUpperCase()}` : ''}
          </div>
        </div>

        {/* Title + Progress */}
        <div style={{ padding: '28px var(--pad-x) 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            &sect; Bake &middot; {recipe.bookId.replace(/-/g, ' ')}
          </div>
          <h1
            className="display"
            style={{
              fontSize: 'clamp(42px, 6vw, 84px)',
              fontWeight: 300,
              margin: 0,
              marginBottom: 18,
              lineHeight: 1.02,
            }}
          >
            {(() => {
              const words = recipe.title.split(' ');
              if (words.length <= 1) return <span className="italic">{recipe.title}</span>;
              return (
                <>
                  {words.slice(0, -1).join(' ')}{' '}
                  <span className="italic">{words[words.length - 1]}</span>
                </>
              );
            })()}
          </h1>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '.18em', color: 'var(--muted)' }}>
              {String(completedSteps.size).padStart(2, '0')} OF {String(totalSteps).padStart(2, '0')} STEPS DONE
            </span>
          </div>
          <div style={{ height: 1, background: 'var(--hairline)', position: 'relative', marginBottom: 32 }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${progress * 100}%`,
              background: 'var(--accent)',
              transition: 'width .5s ease',
            }} />
          </div>
        </div>

        {/* 3-column bake grid */}
        <div className="bake-grid" style={{ padding: '0 var(--pad-x)', paddingBottom: 64 }}>

          {/* ── Left: Step List ── */}
          <aside className="bake-steps" style={{ paddingTop: 4 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Phases</div>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {recipe.steps.map((s, i) => {
                const isDone = completedSteps.has(i);
                const isCurrent = i === currentStep;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => goStep(i)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        width: '100%',
                        padding: '10px 0',
                        textAlign: 'left',
                        borderBottom: '.5px solid var(--hairline)',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        borderBottomStyle: 'solid',
                        borderBottomWidth: '.5px',
                        borderBottomColor: 'var(--hairline)',
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          width: 20,
                          flexShrink: 0,
                          paddingTop: 2,
                          color: isDone
                            ? 'var(--sage)'
                            : isCurrent
                            ? 'var(--accent)'
                            : 'var(--muted-2)',
                        }}
                      >
                        {isDone ? <IcoCheck size={14} /> : String(i + 1).padStart(2, '0')}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'var(--serif-display)',
                            fontSize: 15,
                            fontWeight: 400,
                            fontStyle: isCurrent ? 'italic' : 'normal',
                            textDecoration: isDone ? 'line-through' : 'none',
                            color: isCurrent ? 'var(--ink)' : isDone ? 'var(--muted)' : 'var(--ink-2)',
                            lineHeight: 1.25,
                          }}
                        >
                          {s.title}
                        </div>
                        {s.duration && (
                          <div className="mono" style={{ fontSize: 10, color: 'var(--muted-2)', marginTop: 2 }}>
                            {s.duration}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Scale */}
            <div style={{ marginTop: 20, marginBottom: 12 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Scale</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0.5, 1, 1.5, 2, 3, 4].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMultiplier(m)}
                    className="mono"
                    style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      borderRadius: 999,
                      border: '.5px solid',
                      borderColor: multiplier === m ? 'var(--accent)' : 'var(--hairline)',
                      background: multiplier === m ? 'var(--accent)' : 'transparent',
                      color: multiplier === m ? 'var(--paper)' : 'var(--muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>

            {/* Beginner mode toggle */}
            <button
              type="button"
              onClick={toggleBeginner}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 11, color: beginner ? 'var(--accent)' : 'var(--muted)',
                marginBottom: 24, cursor: 'pointer',
                background: 'none', border: 'none',
              }}
            >
              <div
                style={{
                  width: 24, height: 14, borderRadius: 7, position: 'relative',
                  background: beginner ? 'var(--accent)' : 'var(--hairline)',
                  transition: 'background .2s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute', top: 2, width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--paper)',
                    left: beginner ? 12 : 2,
                    transition: 'left .2s ease',
                  }}
                />
              </div>
              Beginner mode
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={abandonBake}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}
            >
              Pause &amp; come back
            </button>
            <p className="italic" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
              The bake will wait for you.
            </p>
          </aside>

          {/* ── Center: Step Body ── */}
          <div className="bake-body">
            {/* Step eyebrow */}
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              STEP {currentStep + 1} / {totalSteps}
              {step.duration ? ` · ${step.duration}` : ''}
              {step.temperature ? ` · ${step.temperature}` : ''}
            </div>

            {/* Step title */}
            <h2
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: 'clamp(32px, 4vw, 52px)',
                fontWeight: 300,
                margin: 0,
                marginBottom: 20,
                lineHeight: 1.08,
                letterSpacing: '-.01em',
              }}
            >
              {step.title}
            </h2>

            {/* Step body text */}
            <div
              style={{
                fontFamily: 'var(--serif-body)',
                fontSize: 'clamp(17px, 2vw, 21px)',
                lineHeight: 1.65,
                color: 'var(--ink-2)',
                marginBottom: 24,
              }}
            >
              {step.instructions}
            </div>

            {/* Target callout */}
            {step.temperature && (
              <div style={{
                borderLeft: '2px solid var(--accent)',
                background: 'var(--accent-soft)',
                padding: '14px 18px',
                marginBottom: 20,
                fontSize: 15,
                color: 'var(--ink)',
              }}>
                <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 400 }}>Target: </span>
                {step.temperature}
              </div>
            )}

            {/* Beginner guide */}
            {beginner && guide && (
              <div style={{
                background: 'var(--card)',
                border: '.5px solid var(--hairline)',
                padding: '18px 20px',
                marginBottom: 20,
              }}>
                <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--accent)' }}>
                  Note from the baker
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                  <p style={{ marginBottom: 6 }}>
                    <span style={{ color: 'var(--sage)', fontWeight: 600 }}>Ready: </span>
                    {guide.ready}
                  </p>
                  <p style={{ marginBottom: 6 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Not yet: </span>
                    {guide.notReady}
                  </p>
                  <p>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Overdone: </span>
                    {guide.overDone}
                  </p>
                </div>
              </div>
            )}

            {/* Tip box */}
            {step.tip && (
              <div style={{
                background: 'var(--card)',
                border: '.5px solid var(--hairline)',
                padding: '18px 20px',
                marginBottom: 20,
              }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Note from the baker
                </div>
                <p style={{
                  fontFamily: 'var(--serif-body)',
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'var(--ink-2)',
                  fontStyle: 'italic',
                  margin: 0,
                }}>
                  {step.tip}
                </p>
              </div>
            )}

            {/* Note input */}
            {showNoteInput && (
              <div style={{ marginBottom: 20 }}>
                <textarea
                  value={stepNotes[currentStep] || ""}
                  onChange={(e) =>
                    setStepNotes((prev) => ({ ...prev, [currentStep]: e.target.value }))
                  }
                  placeholder="How does the dough look? Any observations..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'transparent',
                    border: '.5px solid var(--hairline)',
                    fontFamily: 'var(--serif-body)',
                    fontSize: 15,
                    color: 'var(--ink)',
                    resize: 'none',
                    height: 80,
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Temp input */}
            {showTempInput && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
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
                  style={{
                    width: 100,
                    padding: '8px 4px',
                    background: 'transparent',
                    borderBottom: '.5px solid var(--hairline-2)',
                    fontFamily: 'var(--mono)',
                    fontSize: 14,
                    color: 'var(--ink)',
                    border: 0,
                    borderBottomStyle: 'solid',
                    borderBottomWidth: '.5px',
                    borderBottomColor: 'var(--hairline-2)',
                    outline: 'none',
                  }}
                />
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>&deg;C</span>
              </div>
            )}

            {/* Step Photos */}
            {stepPhotos[currentStep]?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                {stepPhotos[currentStep].map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Step ${currentStep + 1} photo ${i + 1}`}
                    style={{
                      width: 80, height: 80, objectFit: 'cover', flexShrink: 0,
                      border: '.5px solid var(--hairline)',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Quick capture buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowNoteInput(!showNoteInput)}
                style={{
                  padding: '8px 16px', fontSize: 13, gap: 6,
                  borderColor: showNoteInput || stepNotes[currentStep] ? 'var(--accent)' : undefined,
                  color: showNoteInput || stepNotes[currentStep] ? 'var(--accent)' : undefined,
                }}
              >
                <IcoNote /> Add note
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowTempInput(!showTempInput)}
                style={{
                  padding: '8px 16px', fontSize: 13, gap: 6,
                  borderColor: showTempInput || stepTemps[currentStep] ? 'var(--accent)' : undefined,
                  color: showTempInput || stepTemps[currentStep] ? 'var(--accent)' : undefined,
                }}
              >
                <IcoTemp /> Log temp
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={{
                  padding: '8px 16px', fontSize: 13, gap: 6,
                  opacity: uploadingPhoto ? 0.5 : 1,
                  borderColor: stepPhotos[currentStep]?.length ? 'var(--accent)' : undefined,
                  color: stepPhotos[currentStep]?.length ? 'var(--accent)' : undefined,
                }}
              >
                <IcoPhoto /> {uploadingPhoto ? '...' : 'Take photo'}
              </button>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              style={{ display: 'none' }}
            />

            {/* Bottom nav */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderTop: '.5px solid var(--hairline)',
              paddingTop: 20,
            }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => goStep(currentStep - 1)}
                disabled={currentStep === 0}
                style={{
                  padding: '10px 18px', fontSize: 14, gap: 6,
                  opacity: currentStep === 0 ? 0.3 : 1,
                }}
              >
                <IcoBack /> Previous
              </button>

              {!completedSteps.has(currentStep) ? (
                <button
                  type="button"
                  className="btn"
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
                  style={{ padding: '12px 24px', fontSize: 15, gap: 8 }}
                >
                  <IcoCheck /> {currentStep === totalSteps - 1 ? 'Complete last step' : 'Mark done'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    if (currentStep < totalSteps - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      setShowFinishModal(true);
                    }
                  }}
                  style={{ padding: '10px 18px', fontSize: 14, gap: 6 }}
                >
                  {currentStep === totalSteps - 1 ? 'Finish bake' : 'Skip'} <IcoNext />
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Timer + Ingredients ── */}
          <aside className="bake-timer" style={{ paddingTop: 4 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Timer</div>

            <RingTimer
              total={timerTotal || 1}
              remaining={hasTimer ? timerRemaining : 0}
              running={timerRunning}
              hasTimer={hasTimer}
            />

            {hasTimer ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setTimerRunning(!timerRunning)}
                  style={{ padding: '10px 20px', fontSize: 14, gap: 6 }}
                >
                  {timerRunning ? <IcoPause /> : <IcoPlay />}
                  {timerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => { setTimerRunning(false); setTimerRemaining(timerTotal); }}
                  style={{ padding: '10px 14px', fontSize: 13 }}
                >
                  <IcoReset /> Reset
                </button>
              </div>
            ) : (
              <p className="italic" style={{
                fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginTop: 14,
              }}>
                No fixed time. Watch the dough.
              </p>
            )}

            {/* Step-specific ingredients */}
            {stepIngs.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div className="eyebrow" style={{ marginBottom: 12 }}>This step</div>
                {stepIngs.map(({ group, label, items }) => (
                  <div key={group} style={{ marginBottom: 16 }}>
                    <div className="eyebrow" style={{ fontSize: 9, marginBottom: 6, color: 'var(--muted-2)' }}>
                      {label}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {items.map((row) => {
                        const key = `${group}-${row.name}`;
                        return (
                          <li
                            key={key}
                            onClick={() => {
                              setCheckedIngredients((prev) => {
                                const next = new Set(prev);
                                if (next.has(key)) next.delete(key);
                                else next.add(key);
                                return next;
                              });
                            }}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 48px',
                              padding: '10px 0',
                              borderBottom: '.5px dotted var(--hairline)',
                              alignItems: 'baseline',
                              gap: 10,
                              cursor: 'pointer',
                              textDecoration: checkedIngredients.has(key) ? 'line-through' : 'none',
                              opacity: checkedIngredients.has(key) ? 0.5 : 1,
                            }}
                          >
                            <span style={{ fontSize: 14, color: 'var(--ink)' }}>{row.name}</span>
                            <span className="mono num" style={{ fontSize: 13, textAlign: 'right', color: 'var(--ink)' }}>
                              {scaleWeight(row.weight)}<span style={{ color: 'var(--muted)', fontSize: 10 }}>g</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Finish bake button */}
            <div style={{ marginTop: 32 }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowFinishModal(true)}
                style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
              >
                Finish bake
              </button>
            </div>
          </aside>
        </div>

        {/* ── Finish Modal ── */}
        {showFinishModal && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFinishModal(false);
            }}
          >
            <div style={{
              width: '100%', maxWidth: 600,
              maxHeight: '85vh', overflowY: 'auto',
              background: 'var(--paper)',
              border: '.5px solid var(--hairline)',
              padding: 0,
            }}>
              {/* Modal header */}
              <div style={{
                position: 'sticky', top: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 24px',
                background: 'var(--paper)',
                borderBottom: '.5px solid var(--hairline)',
                zIndex: 2,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {finishStep > 0 && (
                    <button type="button" onClick={() => setFinishStep(finishStep - 1)} style={{ color: 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                      <IcoBack />
                    </button>
                  )}
                  <h2 style={{
                    fontFamily: 'var(--serif-display)', fontSize: 22, fontWeight: 300, margin: 0,
                  }}>
                    {finishStep === 0 ? 'How was it?' : finishStep === 1 ? 'Reflect' : finishStep === 2 ? 'Environment' : 'Details'}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {finishStep + 1} / {beginner ? 3 : 4}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setShowFinishModal(false); setFinishStep(0); }}
                    style={{ color: 'var(--muted)', fontSize: 18, cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Step dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '16px 24px 8px' }}>
                {Array.from({ length: beginner ? 3 : 4 }).map((_, i) => (
                  <div key={i} style={{
                    height: 1,
                    width: i === finishStep ? 24 : 10,
                    background: i <= finishStep ? 'var(--accent)' : 'var(--hairline)',
                    transition: 'all .2s ease',
                  }} />
                ))}
              </div>

              <div style={{ padding: '20px 24px 28px' }}>
                {/* Step 0: Ratings */}
                {finishStep === 0 && (
                  <div>
                    <div style={beginner ? {} : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {(beginner
                        ? [{ label: "How did it go?", value: overallRating, set: setOverallRating }]
                        : [
                            { label: "Overall", value: overallRating, set: setOverallRating },
                            { label: "Crumb", value: crumbRating, set: setCrumbRating },
                            { label: "Crust", value: crustRating, set: setCrustRating },
                            { label: "Flavor", value: flavorRating, set: setFlavorRating },
                          ]
                      ).map(({ label, value, set }) => (
                        <div key={label} style={{ padding: '14px 0', borderBottom: '.5px solid var(--hairline)' }}>
                          <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} type="button" onClick={() => { navigator.vibrate?.(10); set(star); }}
                                style={{
                                  fontSize: 16, cursor: 'pointer', background: 'none', border: 'none', padding: '2px',
                                  color: star <= value ? 'var(--accent)' : 'var(--hairline)',
                                }}
                              >
                                {star <= value ? '★' : '☆'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="btn" onClick={() => setFinishStep(1)} style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: '14px 24px' }}>
                      Continue
                    </button>
                  </div>
                )}

                {/* Step 1: Notes */}
                {finishStep === 1 && (
                  <div>
                    {[
                      { label: "What went well?", value: whatWentWell, set: setWhatWentWell, placeholder: "Great oven spring, nice ear..." },
                      { label: "What to improve?", value: whatToImprove, set: setWhatToImprove, placeholder: "Shape was a bit loose..." },
                      { label: "Modifications", value: modifications, set: setModifications, placeholder: "Changed hydration, different flour..." },
                      { label: "Other notes", value: overallNotes, set: setOverallNotes, placeholder: "Anything else worth remembering..." },
                    ].map(({ label, value, set, placeholder }) => (
                      <div key={label} style={{ marginBottom: 16 }}>
                        <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
                        <textarea
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          placeholder={placeholder}
                          style={{
                            width: '100%', padding: '10px 4px',
                            background: 'transparent',
                            border: 0, borderBottom: '.5px solid var(--hairline)',
                            fontFamily: 'var(--serif-body)', fontSize: 15,
                            color: 'var(--ink)', resize: 'none', height: 60, outline: 'none',
                          }}
                        />
                      </div>
                    ))}
                    <button type="button" className="btn" onClick={() => setFinishStep(2)} style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '14px 24px' }}>
                      Continue
                    </button>
                  </div>
                )}

                {/* Step 2: Environment */}
                {finishStep === 2 && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {[
                        { label: "Flour brand", value: flourBrand, set: setFlourBrand, type: "text", placeholder: "King Arthur...", max: 100 },
                        { label: "Room temp (°C)", value: ambientTemp, set: setAmbientTemp, type: "number", placeholder: "22", min: -10, max: 60 },
                        { label: "Dough temp (°C)", value: doughTemp, set: setDoughTemp, type: "number", placeholder: "25", min: 0, max: 60 },
                        { label: "Humidity (%)", value: humidity, set: setHumidity, type: "number", placeholder: "65", min: 0, max: 100 },
                      ].map(({ label, value, set, type, placeholder, min, max }) => (
                        <div key={label} style={{ marginBottom: 8 }}>
                          <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
                          <input
                            type={type}
                            value={value}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (type === 'text') { set(v); return; }
                              if (v === "" || (Number(v) >= (min ?? 0) && Number(v) <= (max ?? 999))) set(v);
                            }}
                            maxLength={type === 'text' ? (max ?? undefined) : undefined}
                            placeholder={placeholder}
                            style={{
                              width: '100%', padding: '8px 4px',
                              background: 'transparent',
                              border: 0, borderBottom: '.5px solid var(--hairline-2)',
                              fontFamily: 'var(--mono)', fontSize: 14,
                              color: 'var(--ink)', outline: 'none',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    {beginner ? (
                      <button type="button" className="btn" onClick={finishBake} disabled={saving} style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '14px 24px', opacity: saving ? 0.5 : 1 }}>
                        {saving ? 'Saving...' : 'Record this bake'}
                      </button>
                    ) : (
                      <button type="button" className="btn" onClick={() => setFinishStep(3)} style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '14px 24px' }}>
                        Continue
                      </button>
                    )}
                  </div>
                )}

                {/* Step 3: Details (advanced only) */}
                {finishStep === 3 && !beginner && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {[
                        { label: "Starter hydration", value: starterHydration, set: setStarterHydration, type: "text", placeholder: "100%", max: 20 },
                        { label: "Starter notes", value: starterNotes, set: setStarterNotes, type: "text", placeholder: "Peaked at 6hrs...", max: 200 },
                        { label: "Bulk ferment (hrs)", value: bulkHours, set: setBulkHours, type: "number", placeholder: "4", min: 0, max: 48 },
                        { label: "Proof time (hrs)", value: proofHours, set: setProofHours, type: "number", placeholder: "12", min: 0, max: 48 },
                        { label: "Bake time (min)", value: bakeTimeMin, set: setBakeTimeMin, type: "number", placeholder: "45", min: 0, max: 180 },
                        { label: "Oven temp (°C)", value: bakeTempC, set: setBakeTempC, type: "number", placeholder: "230", min: 0, max: 350 },
                      ].map(({ label, value, set, type, placeholder, min, max }) => (
                        <div key={label} style={{ marginBottom: 8 }}>
                          <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
                          <input
                            type={type}
                            value={value}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (type === 'text') { set(v); return; }
                              if (v === "" || (Number(v) >= (min ?? 0) && Number(v) <= (max ?? 999))) set(v);
                            }}
                            maxLength={type === 'text' ? (max ?? undefined) : undefined}
                            placeholder={placeholder}
                            style={{
                              width: '100%', padding: '8px 4px',
                              background: 'transparent',
                              border: 0, borderBottom: '.5px solid var(--hairline-2)',
                              fontFamily: 'var(--mono)', fontSize: 14,
                              color: 'var(--ink)', outline: 'none',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <button type="button" className="btn" onClick={finishBake} disabled={saving} style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '14px 24px', opacity: saving ? 0.5 : 1 }}>
                      {saving ? 'Saving...' : 'Record this bake'}
                    </button>
                  </div>
                )}

                <button type="button" onClick={abandonBake} style={{
                  width: '100%', textAlign: 'center',
                  fontFamily: 'var(--serif-display)', fontStyle: 'italic',
                  fontSize: 14, color: 'var(--muted)', marginTop: 16,
                  padding: '8px 0', cursor: 'pointer', background: 'none', border: 'none',
                }}>
                  Abandon
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
