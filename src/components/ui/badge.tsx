"use client";

const variants = {
  default: {
    background: "var(--surface-2)",
    color: "var(--ink-soft)",
    border: "1px solid var(--border)",
  },
  amber: {
    background: "rgba(232,155,60,0.12)",
    color: "var(--crust)",
    border: "1px solid rgba(232,155,60,0.4)",
  },
  emerald: {
    background: "rgba(107,148,98,0.15)",
    color: "var(--leaf-soft)",
    border: "1px solid rgba(107,148,98,0.4)",
  },
  rose: {
    background: "rgba(199,90,58,0.15)",
    color: "var(--jam-soft)",
    border: "1px solid rgba(199,90,58,0.4)",
  },
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider"
      style={variants[variant]}
    >
      {children}
    </span>
  );
}
