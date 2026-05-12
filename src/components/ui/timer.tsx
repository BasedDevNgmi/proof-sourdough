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

  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <span className="text-xs text-stone-500 font-medium">{label}</span>
      )}
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-stone-800"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${
              remaining === 0 ? "text-emerald-400" : "text-amber-500"
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-mono text-xl font-medium tabular-nums ${
              remaining === 0 ? "text-emerald-400" : "text-stone-200"
            } ${running ? "animate-gentle-pulse" : ""}`}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setRunning(!running)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-800 active:bg-stone-700 transition-colors"
        >
          {running ? (
            <Pause size={18} className="text-stone-300" />
          ) : (
            <Play size={18} className="text-amber-500 ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-800 active:bg-stone-700 transition-colors"
        >
          <RotateCcw size={16} className="text-stone-400" />
        </button>
      </div>
    </div>
  );
}
