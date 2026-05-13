"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { ProofLogo } from "@/components/illustrations/proof-logo";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: (p: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M3 12L12 4l9 8" /><path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    href: "/recipes",
    label: "Recipes",
    icon: (p: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2V5z" /><path d="M20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2V5z" />
      </svg>
    ),
  },
  {
    href: "/bake",
    label: "Bake",
    icon: (p: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M6 14a4 4 0 0 1-2-7.5A4 4 0 0 1 12 5a4 4 0 0 1 8 1.5A4 4 0 0 1 18 14v6H6v-6z" /><path d="M9 20v-3M15 20v-3M12 20v-3" />
      </svg>
    ),
  },
  {
    href: "/starter",
    label: "Starter",
    icon: (p: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <ellipse cx="12" cy="16" rx="8" ry="5" /><path d="M4 16V12c0-2.8 3.6-5 8-5s8 2.2 8 5v4" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="14" r="0.8" /><circle cx="12" cy="11" r="1.2" />
      </svg>
    ),
  },
  {
    href: "/journal",
    label: "Journal",
    icon: (p: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
        <path d="M4 4h12l4 4v12H4z" /><path d="M16 4v4h4" /><path d="M8 12h8M8 16h6" />
      </svg>
    ),
  },
];

function SunIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </svg>
  );
}

function MoonIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />
    </svg>
  );
}

function SignoutIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

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
      <aside
        className="proof-sidebar hidden lg:flex fixed top-0 left-0 bottom-0 z-50 flex-col"
        style={{
          width: 260,
          borderRight: "1px solid var(--border)",
          background: "var(--bg-warm)",
          padding: "24px 18px",
          gap: 24,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Brand */}
        <div style={{ padding: "4px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          <ProofLogo size={32} />
          <span style={{ fontSize: 11, color: "var(--ink-mute)", letterSpacing: "0.05em" }}>sourdough journal</span>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(({ href, icon: NavIcon, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 transition-all duration-200"
                style={{
                  padding: "11px 14px",
                  background: isActive ? "var(--surface-3)" : "transparent",
                  border: isActive ? "1px solid var(--border-strong)" : "1px solid transparent",
                  color: isActive ? "var(--crust)" : "var(--ink-soft)",
                  borderRadius: "var(--radius)",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--surface-2)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <NavIcon width={18} height={18} />
                {label}
                {isActive && (
                  <span style={{
                    marginLeft: "auto",
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--crust)",
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="sidebar-bottom" style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2.5 w-full transition-all duration-200"
            style={{
              padding: "10px 12px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--ink-soft)",
              fontFamily: "inherit",
              fontSize: 13,
              cursor: "pointer",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2.5 w-full"
            style={{
              padding: "10px 12px",
              background: "transparent",
              border: "none",
              color: "var(--ink-mute)",
              fontFamily: "inherit",
              fontSize: 13,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <SignoutIcon width={16} height={16} />
            Sign out
          </button>
          <div className="sidebar-bottom-meta" style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 4px",
            marginTop: 6,
            borderTop: "1px solid var(--border)",
            paddingTop: 14,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, var(--crust), var(--jam))",
              display: "grid", placeItems: "center",
              color: "var(--bg)", fontWeight: 700, fontSize: 13,
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{displayName}</div>
              <div style={{ fontSize: 10, color: "var(--ink-mute)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="mobile-topbar lg:hidden">
        <ProofLogo size={26} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--ink-soft)",
              display: "grid", placeItems: "center", cursor: "pointer",
            }}
          >
            {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="proof-sidebar lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--bg-warm)",
          boxShadow: "0 -12px 32px -16px rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          {navItems.map(({ href, icon: NavIcon, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
                style={{
                  color: isActive ? "var(--crust)" : "var(--ink-mute)",
                  background: isActive ? "var(--accent-surface)" : "transparent",
                  textDecoration: "none",
                }}
              >
                <NavIcon width={22} height={22} />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggle}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
            style={{ color: "var(--ink-mute)" }}
          >
            {theme === "dark" ? <SunIcon width={20} height={20} /> : <MoonIcon width={20} height={20} />}
            <span className="text-[10px] font-medium tracking-wide">Theme</span>
          </button>
        </div>
      </nav>
    </>
  );
}
