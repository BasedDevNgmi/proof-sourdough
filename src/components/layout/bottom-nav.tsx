"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ChefHat, NotebookPen } from "lucide-react";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/recipes", icon: BookOpen, label: "Recipes" },
  { href: "/bake", icon: ChefHat, label: "Bake" },
  { href: "/journal", icon: NotebookPen, label: "Journal" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/bake/") && pathname.split("/").length > 2) {
    return null;
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 z-50 flex-col border-r border-stone-800/50 bg-stone-950/95 backdrop-blur-sm">
        <div className="px-6 pt-10 pb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight text-stone-100">
            Proof
          </h1>
          <p className="text-[11px] text-stone-600 mt-1 tracking-wide">Sourdough companion</p>
        </div>
        <div className="flex-1 px-3 space-y-0.5">
          {links.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                    : "text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 border border-transparent"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="px-6 py-6 border-t border-stone-800/30">
          <p className="text-[10px] text-stone-700 tracking-wider uppercase">The Perfect Loaf</p>
          <p className="text-[10px] text-stone-600 mt-0.5">61 recipes</p>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-stone-800/30 mb-safe">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {links.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-amber-500"
                    : "text-stone-500 active:text-stone-300"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="text-[10px] font-medium tracking-wide">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
