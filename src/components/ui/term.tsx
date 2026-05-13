"use client";

import { useState, useRef, useEffect } from "react";
import { lookupTerm } from "@/data/glossary";

export function Term({ children }: { children: string }) {
  const entry = lookupTerm(children);
  const [open, setOpen] = useState(false);
  const [showLong, setShowLong] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowLong(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  if (!entry) return <>{children}</>;

  return (
    <span ref={ref} style={{ position: "relative", display: "inline" }}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setShowLong(false); }}
        style={{
          background: "none",
          border: "none",
          borderBottom: "1px dashed var(--accent, #d97706)",
          color: "inherit",
          cursor: "help",
          padding: 0,
          font: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
        }}
      >
        {children}
      </button>
      {open && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 280,
            maxWidth: "90vw",
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--card, #fff)",
            border: "1px solid var(--border-subtle, #e5e5e5)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 100,
            textAlign: "left",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--accent, #d97706)",
              marginBottom: 6,
              fontFamily: "var(--font-body)",
            }}
          >
            {entry.term}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--text-secondary, #666)",
              fontFamily: "var(--font-body)",
            }}
          >
            {showLong && entry.long ? entry.long : entry.short}
          </span>
          {entry.long && !showLong && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowLong(true); }}
              style={{
                display: "block",
                marginTop: 8,
                fontSize: 11,
                color: "var(--accent, #d97706)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "var(--font-body)",
              }}
            >
              Tell me more
            </button>
          )}
          <span
            style={{
              position: "absolute",
              bottom: -5,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 10,
              height: 10,
              background: "var(--card, #fff)",
              borderRight: "1px solid var(--border-subtle, #e5e5e5)",
              borderBottom: "1px solid var(--border-subtle, #e5e5e5)",
            }}
          />
        </span>
      )}
    </span>
  );
}
