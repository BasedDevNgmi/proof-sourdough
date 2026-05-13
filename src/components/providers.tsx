"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGuard } from "@/components/auth-guard";
import { ErrorBoundary } from "@/components/error-boundary";
import { BottomNav } from "@/components/layout/bottom-nav";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { InstallPrompt } from "@/components/ui/install-prompt";
import { trackEvent } from "@/lib/analytics";
import { flushQueue } from "@/lib/offline-queue";
import { supabase } from "@/lib/supabase";
import { useKonami } from "@/hooks/use-konami";

const AUTH_PAGES = ["/login"];

function KonamiToast() {
  const [show, setShow] = useState(false);

  const activate = useCallback(() => {
    localStorage.setItem("proof-bakers-dozen", "true");
    setShow(true);
    setTimeout(() => setShow(false), 3000);
  }, []);

  useKonami(activate);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-medium"
          style={{
            background: "var(--card)",
            border: "1px solid var(--accent)",
            color: "var(--text)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          Baker&apos;s Dozen activated — because 12 is never enough
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  useEffect(() => {
    trackEvent("app_open");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const flushOfflineQueue = () => {
      flushQueue(async (table, operation, data) => {
        try {
          const query = supabase.from(table);
          if (operation === "insert") await query.insert(data);
          else if (operation === "update") await query.update(data);
          else if (operation === "upsert") await query.upsert(data);
          return true;
        } catch {
          return false;
        }
      }).catch(() => {});
    };

    window.addEventListener("online", flushOfflineQueue);
    if (navigator.onLine) flushOfflineQueue();
    return () => window.removeEventListener("online", flushOfflineQueue);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary variant="global">
          <AuthGuard>
            {isAuthPage ? (
              children
            ) : (
              <>
                <main className="flex-1 pb-20 lg:pb-0 lg:pl-[260px]">{children}</main>
                <BottomNav />
                <OfflineIndicator />
                <InstallPrompt />
                <KonamiToast />
              </>
            )}
          </AuthGuard>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}
