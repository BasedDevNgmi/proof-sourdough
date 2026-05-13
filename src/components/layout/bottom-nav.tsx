"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";

const ISSUE = { volume: "III", number: "05", date: "May · MMXXVI" };

const navItems = [
  { href: "/", id: "home", label: "Home" },
  { href: "/recipes", id: "recipes", label: "Library" },
  { href: "/bake", id: "bake", label: "Bake" },
  { href: "/starter", id: "starter", label: "Starter" },
  { href: "/journal", id: "journal", label: "Journal" },
];

const mobileTabItems = [
  { href: "/", id: "home", label: "Home" },
  { href: "/recipes", id: "recipes", label: "Library" },
  { href: "/bake", id: "bake", label: "Bake" },
  { href: "/journal", id: "journal", label: "Journal" },
];

function Ic({ d, size = 16, sw = 1.25, fill = "none" }: { d: React.ReactNode; size?: number; sw?: number; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
}

function NavIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>,
    recipes: <><path d="M5 4h6v16H5z" /><path d="M13 4h6v16h-6z" /></>,
    bake: <><path d="M7 21V11a5 5 0 0110 0v10" /><path d="M5 21h14" /></>,
    starter: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
    journal: <><path d="M5 3h14v18H5z" /><path d="M9 7h8M9 11h8M9 15h5" /></>,
  };
  return <Ic d={icons[id] || icons.home} />;
}

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname.startsWith("/bake/") && pathname.split("/").length > 2) {
    return null;
  }

  const activeId = pathname === "/"
    ? "home"
    : pathname.startsWith("/recipes") ? "recipes"
    : pathname.startsWith("/bake") ? "bake"
    : pathname.startsWith("/starter") ? "starter"
    : pathname.startsWith("/journal") ? "journal"
    : "home";

  return (
    <>
      {/* ── Desktop Masthead ── */}
      <header className="hidden lg:flex flex-col sticky top-0 z-50" style={{
        padding: '20px var(--pad-x) 14px',
        background: 'var(--paper)',
        borderBottom: '.5px solid var(--hairline)',
      }}>
        <div className="mono" style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10.5, letterSpacing: '.16em',
          color: 'var(--muted)', textTransform: 'uppercase',
        }}>
          <span>Vol. {ISSUE.volume} · № {ISSUE.number}</span>
          <span>{ISSUE.date}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, marginTop: 14 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: 12, textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--serif-display)', fontWeight: 300,
              fontSize: 'clamp(34px, 5vw, 52px)', letterSpacing: '-.02em',
              lineHeight: .9, color: 'var(--ink)',
            }}>Proof</span>
            <span className="hidden xl:inline" style={{
              color: 'var(--muted)', fontSize: 'clamp(13px, 1.4vw, 17px)',
              fontStyle: 'italic', fontFamily: 'var(--serif-display)',
            }}>— a sourdough journal</span>
          </Link>
          <nav className="nav-desktop" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {navItems.map(item => {
              const isActive = activeId === item.id;
              return (
                <Link key={item.href} href={item.href} style={{
                  fontFamily: 'var(--serif-display)', fontSize: 18,
                  color: isActive ? 'var(--ink)' : 'var(--muted)',
                  fontStyle: isActive ? 'italic' : 'normal',
                  position: 'relative', paddingBottom: 4,
                  textDecoration: 'none', transition: 'color .25s ease',
                }}>
                  {item.label}
                  {isActive && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 1, background: 'var(--ink)' }} />}
                </Link>
              );
            })}
            <span style={{ width: 1, height: 18, background: 'var(--hairline)' }} />
            <button type="button" onClick={toggle} aria-label="Toggle theme" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
              {theme === "dark"
                ? <Ic d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>} />
                : <Ic d={<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />} />
              }
            </button>
          </nav>
        </div>
      </header>

      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden sticky top-0 z-50" style={{
        background: 'var(--paper)', padding: '14px 20px 12px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        borderBottom: '.5px solid var(--hairline)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 300, fontSize: 28, letterSpacing: '-.02em', color: 'var(--ink)' }}>Proof</span>
          <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '.16em', textTransform: 'uppercase' }}>
            Vol.{ISSUE.volume}·№{ISSUE.number}
          </span>
        </Link>
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Menu" style={{ color: 'var(--ink)', display: 'flex' }}>
          <Ic d={<><path d="M4 7h16M4 12h16M4 17h16" /></>} />
        </button>
      </header>

      {/* ── Mobile Bottom Tabs ── */}
      <nav className="lg:hidden safe-bot fixed bottom-0 left-0 right-0 z-50" style={{
        display: 'flex', justifyContent: 'space-around',
        background: 'var(--paper)', borderTop: '.5px solid var(--hairline)',
        padding: '10px 12px 12px',
      }}>
        {mobileTabItems.map(item => {
          const isActive = activeId === item.id;
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: isActive ? 'var(--ink)' : 'var(--muted)',
              textDecoration: 'none', padding: '4px 12px', fontSize: 18,
            }}>
              <NavIcon id={item.id} />
              <span style={{
                fontFamily: 'var(--serif-display)', fontSize: 12,
                fontStyle: isActive ? 'italic' : 'normal', letterSpacing: '.02em',
              }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile Menu Overlay ── */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(28,24,20,.45)', backdropFilter: 'blur(8px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 'min(360px, 90vw)', background: 'var(--paper)',
            padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18,
            boxShadow: 'var(--shadow-soft)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="eyebrow">Menu</span>
              <button type="button" onClick={() => setMenuOpen(false)} style={{ color: 'var(--ink)' }}>
                <Ic d={<><path d="M6 6l12 12M18 6L6 18" /></>} />
              </button>
            </div>
            <hr style={{ height: 1, background: 'var(--hairline)', border: 0, margin: 0 }} />
            {navItems.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
                textAlign: 'left', fontFamily: 'var(--serif-display)',
                fontSize: 30, fontWeight: 300,
                color: activeId === item.id ? 'var(--ink)' : 'var(--muted)',
                fontStyle: activeId === item.id ? 'italic' : 'normal',
                padding: '6px 0', textDecoration: 'none',
              }}>{item.label}</Link>
            ))}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button type="button" onClick={toggle} className="btn-ghost" style={{ fontSize: 14, padding: '10px 16px' }}>
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button type="button" onClick={signOut} style={{
                fontSize: 14, padding: '10px 16px', color: 'var(--muted)',
                fontFamily: 'var(--serif-display)', textAlign: 'left',
              }}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
