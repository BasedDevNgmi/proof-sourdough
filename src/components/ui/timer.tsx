"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export function Timer({
  durationMinutes,
  label,
  onComplete,
}: {
  durationMinutes: number;
  label?: string;
  onComplete?: () => void;
}) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          onCompleteRef.current?.();
          if (typeof window !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, remaining]);

  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = 1 - remaining / totalSeconds;

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const isComplete = remaining === 0;

  return (
    <div className="flex flex-col items-center gap-4">
      {label && (
        <span className="text-[10px] text-stone-600 font-medium uppercase tracking-wider">{label}</span>
      )}
      <div className="relative w-32 h-32">
        {/* Ambient glow when running */}
        {running && (
          <div className="absolute inset-0 rounded-full bg-amber-500/5 blur-xl animate-gentle-pulse" />
        )}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-stone-800/50"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${
              isComplete ? "text-emerald-400" : "text-amber-500"
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono text-2xl font-light tabular-nums tracking-wider ${
              isComplete ? "text-emerald-400" : "text-stone-200"
            } ${running ? "animate-gentle-pulse" : ""}`}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          {isComplete && (
            <span className="text-[9px] text-emerald-500/80 uppercase tracking-widest mt-1">Done</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning(!running)}
          className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 ${
            running
              ? "bg-stone-800 hover:bg-stone-700"
              : "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
          }`}
        >
          {running ? (
            <Pause size={16} className="text-stone-300" />
          ) : (
            <Play size={16} className="text-stone-950 ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-stone-800/50 hover:bg-stone-800 transition-colors"
        >
          <RotateCcw size={14} className="text-stone-400" />
        </button>
      </div>
    </div>
  );
}
