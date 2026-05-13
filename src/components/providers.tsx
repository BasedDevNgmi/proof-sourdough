"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";

const AUTH_PAGES = ["/login"];

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard>
          {isAuthPage ? (
            children
          ) : (
            <>
              <main className="flex-1 pb-20 lg:pb-0 lg:pl-64">{children}</main>
              <BottomNav />
            </>
          )}
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
