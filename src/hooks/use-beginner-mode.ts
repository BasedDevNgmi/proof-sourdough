"use client";

import { useState, useEffect, useCallback } from "react";

export function useBeginnerMode() {
  const [beginner, setBeginner] = useState(false);

  useEffect(() => {
    setBeginner(localStorage.getItem("proof-beginner-mode") === "true");
  }, []);

  const toggle = useCallback(() => {
    setBeginner((prev) => {
      const next = !prev;
      localStorage.setItem("proof-beginner-mode", String(next));
      return next;
    });
  }, []);

  return { beginner, toggle };
}
