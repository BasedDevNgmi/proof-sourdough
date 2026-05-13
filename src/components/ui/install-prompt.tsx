"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("proof-install-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function dismiss() {
    setDismissed(true);
    setDeferredPrompt(null);
    localStorage.setItem("proof-install-dismissed", "1");
  }

  return (
    <AnimatePresence>
      {deferredPrompt && !dismissed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 lg:left-auto lg:right-6 lg:bottom-6 lg:w-80 z-50 rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Add Proof to home screen
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Bake offline, get timer notifications
            </p>
          </div>
          <button
            type="button"
            onClick={install}
            className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            <Download size={14} /> Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 p-1"
            style={{ color: "var(--text-faint)" }}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
