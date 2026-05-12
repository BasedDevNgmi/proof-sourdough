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

  // Hide nav during active bake session
  if (pathname.startsWith("/bake/") && pathname.split("/").length > 2) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-stone-800/50 mb-safe">
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
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <span className="text-[10px] font-medium tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
