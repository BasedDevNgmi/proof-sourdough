"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

let audioCtx: AudioContext | null = null;
function playSound(type: "ding" | "tick") {
  if (typeof window === "undefined") return;
  if (!audioCtx) audioCtx = new AudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  if (type === "ding") {
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } else {
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }
}

function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendNotification(label?: string) {
  if (typeof window === "undefined") return;
  playSound("ding");
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
          const left = Math.max(0, Math.ceil((storedEnd - Date.now()) / 1000));
          setRemaining(left > 0 ? left : totalSeconds);
        }
      } catch {
        localStorage.removeItem(lsKey);
      }
    }
  }, [lsKey, totalSeconds, label]);

  useEffect(() => {
    if (running && endTime) {
      localStorage.setItem(lsKey, JSON.stringify({ endTime, running: true }));
    } else if (!running && remaining < totalSeconds && remaining > 0) {
      const futureEnd = Date.now() + remaining * 1000;
      localStorage.setItem(lsKey, JSON.stringify({ endTime: futureEnd, running: false }));
    }
  }, [running, endTime, remaining, lsKey, totalSeconds]);

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
    playSound("tick");
    completedRef.current = false;
    const end = Date.now() + remaining * 1000;
    setEndTime(end);
    setRunning(true);
  }, [remaining]);

  const pause = useCallback(() => {
    playSound("tick");
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
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</span>
      )}
      <div className="relative w-32 h-32">
        {running && (
          <div className="absolute inset-0 rounded-full blur-xl animate-gentle-pulse" style={{ background: "var(--accent-surface)" }} />
        )}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="2"
            style={{ stroke: "var(--border)" }}
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
            style={{ stroke: isComplete ? "#34d399" : "var(--accent)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono text-2xl font-light tabular-nums tracking-wider ${running ? "animate-gentle-pulse" : ""}`}
            style={{ color: isComplete ? "#34d399" : "var(--text)" }}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          {isComplete && (
            <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: "rgba(52, 211, 153, 0.8)" }}>Done</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => (running ? pause() : start())}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200"
          style={{
            background: running ? "var(--bg-subtle)" : "var(--accent)",
          }}
        >
          {running ? (
            <Pause size={16} style={{ color: "var(--text-secondary)" }} />
          ) : (
            <Play size={16} className="ml-0.5" style={{ color: "var(--bg)" }} />
          )}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-colors"
          style={{ background: "var(--accent-surface)" }}
        >
          <RotateCcw size={14} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>
    </div>
  );
}
