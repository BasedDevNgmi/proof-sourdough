"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendNotification(label?: string) {
  if (typeof window === "undefined") return;
  if ("vibrate" in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Timer done!", {
      body: label ? `${label} is complete` : "Your timer has finished",
      icon: "/icon-192.png",
      tag: "proof-timer",
    });
  }
}

export function Timer({
  durationMinutes,
  label,
  storageKey,
  onComplete,
}: {
  durationMinutes: number;
  label?: string;
  storageKey?: string;
  onComplete?: () => void;
}) {
  const totalSeconds = durationMinutes * 60;
  const lsKey = storageKey || `proof-timer-${label || durationMinutes}`;

  const [endTime, setEndTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    requestNotificationPermission();

    const stored = localStorage.getItem(lsKey);
    if (stored) {
      try {
        const { endTime: storedEnd, running: wasRunning } = JSON.parse(stored);
        if (wasRunning && storedEnd) {
          const now = Date.now();
          const left = Math.max(0, Math.ceil((storedEnd - now) / 1000));
          if (left > 0) {
            setEndTime(storedEnd);
            setRemaining(left);
            setRunning(true);
          } else {
            setRemaining(0);
            setRunning(false);
            localStorage.removeItem(lsKey);
            if (!completedRef.current) {
              completedRef.current = true;
              sendNotification(label);
              onCompleteRef.current?.();
            }
          }
        } else if (!wasRunning && storedEnd) {
          // Was paused — restore remaining time
          const left = Math.max(0, Math.ceil((storedEnd - Date.now()) / 1000));
          setRemaining(left > 0 ? left : totalSeconds);
        }
      } catch {
        localStorage.removeItem(lsKey);
      }
    }
  }, [lsKey, totalSeconds, label]);

  // Persist state changes to localStorage
  useEffect(() => {
    if (running && endTime) {
      localStorage.setItem(lsKey, JSON.stringify({ endTime, running: true }));
    } else if (!running && remaining < totalSeconds && remaining > 0) {
      const futureEnd = Date.now() + remaining * 1000;
      localStorage.setItem(lsKey, JSON.stringify({ endTime: futureEnd, running: false }));
    }
  }, [running, endTime, remaining, lsKey, totalSeconds]);

  // Tick loop — calculates from endTime so it works after backgrounding
  useEffect(() => {
    if (!running || !endTime) return;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endTime - now) / 1000));
      setRemaining(left);

      if (left <= 0) {
        setRunning(false);
        localStorage.removeItem(lsKey);
        if (!completedRef.current) {
          completedRef.current = true;
          sendNotification(label);
          onCompleteRef.current?.();
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [running, endTime, lsKey, label]);

  // Also recalculate on visibility change (tab/app comes back to foreground)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && running && endTime) {
        const now = Date.now();
        const left = Math.max(0, Math.ceil((endTime - now) / 1000));
        setRemaining(left);
        if (left <= 0) {
          setRunning(false);
          localStorage.removeItem(lsKey);
          if (!completedRef.current) {
            completedRef.current = true;
            sendNotification(label);
            onCompleteRef.current?.();
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [running, endTime, lsKey, label]);

  const start = useCallback(() => {
    completedRef.current = false;
    const end = Date.now() + remaining * 1000;
    setEndTime(end);
    setRunning(true);
  }, [remaining]);

  const pause = useCallback(() => {
    if (endTime) {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(left);
    }
    setRunning(false);
  }, [endTime]);

  const reset = useCallback(() => {
    setRunning(false);
    setEndTime(null);
    setRemaining(totalSeconds);
    completedRef.current = false;
    localStorage.removeItem(lsKey);
  }, [totalSeconds, lsKey]);

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
          onClick={() => (running ? pause() : start())}
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
