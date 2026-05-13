"use client";

import { useState, useEffect, useCallback } from "react";

type DoughyMood = "happy" | "sleepy" | "hungry";

interface DoughyState {
  happiness: number;
  mood: DoughyMood;
  feed: () => void;
}

export function useDoughy(): DoughyState {
  const [happiness, setHappiness] = useState(72);

  useEffect(() => {
    const last = parseInt(localStorage.getItem("proof-doughy-last") || String(Date.now()), 10);
    const saved = parseInt(localStorage.getItem("proof-doughy-happy") || "72", 10);
    const hoursElapsed = (Date.now() - last) / 1000 / 60 / 60;
    const decay = Math.min(40, hoursElapsed * 2);
    setHappiness(Math.max(10, Math.round(saved - decay)));
  }, []);

  useEffect(() => {
    localStorage.setItem("proof-doughy-happy", String(happiness));
    localStorage.setItem("proof-doughy-last", String(Date.now()));
  }, [happiness]);

  const feed = useCallback(() => {
    setHappiness(h => Math.min(100, h + 18));
  }, []);

  const mood: DoughyMood = happiness > 60 ? "happy" : happiness > 30 ? "sleepy" : "hungry";

  return { happiness, mood, feed };
}
