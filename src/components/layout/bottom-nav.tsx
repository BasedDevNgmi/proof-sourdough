"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, ChefHat, NotebookPen, Sun, Moon, Wheat, LogOut, User } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/recipes", icon: BookOpen, label: "Recipes" },
  { href: "/bake", icon: ChefHat, label: "Bake" },
  { href: "/journal", icon: NotebookPen, label: "Journal" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();

  if (pathname.startsWith("/bake/") && pathname.split("/").length > 2) {
    return null;
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 z-50 flex-col border-r" style={{ borderColor: "var(--border-subtle)", background: "var(--nav-bg)", backdropFilter: "blur(12px)" }}>
        <div className="px-6 pt-10 pb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            Proof
          </h1>
          <p className="text-[11px] mt-1 tracking-wide" style={{ color: "var(--text-ghost)" }}>Sourdough companion</p>
        </div>
        <div className="flex-1 px-3 space-y-0.5">
          {links.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group border"
                style={{
                  background: isActive ? "var(--accent-surface)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  borderColor: isActive ? "var(--accent-surface)" : "transparent",
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="px-4 pb-3 space-y-0.5">
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl transition-all duration-200"
            style={{ color: "var(--text-muted)" }}
          >
            {theme === "dark" ? <Sun size={16} /> : theme === "light" ? <Wheat size={16} /> : <Moon size={16} />}
            <span className="text-xs font-medium">{theme === "dark" ? "Light mode" : theme === "light" ? "Crust mode" : "Dark mode"}</span>
          </button>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl transition-all duration-200"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut size={16} />
            <span className="text-xs font-medium">Sign out</span>
          </button>
        </div>
        <div className="px-6 py-5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--accent-surface)", color: "var(--accent)" }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{displayName}</p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-ghost)" }}>{user?.email}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t mb-safe" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {links.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
                style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "var(--accent-surface)", zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="text-[10px] font-medium tracking-wide">
                  {label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggle}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
            style={{ color: "var(--text-muted)" }}
          >
            {theme === "dark" ? <Sun size={20} strokeWidth={1.6} /> : theme === "light" ? <Wheat size={20} strokeWidth={1.6} /> : <Moon size={20} strokeWidth={1.6} />}
            <span className="text-[10px] font-medium tracking-wide">Theme</span>
          </button>
        </div>
      </nav>
    </>
  );
}
