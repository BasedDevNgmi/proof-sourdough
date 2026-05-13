"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
          <p
            className="font-[family-name:var(--font-playfair)] text-xl font-semibold tracking-tight"
            style={{ color: "var(--text)" }}
          >
            Proof
          </p>
        </div>
      </div>
    );
  }

  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
