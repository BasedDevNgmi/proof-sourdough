"use client";

const variants = {
  default: {
    background: "var(--surface-2)",
    color: "var(--ink-soft)",
    border: "1px solid var(--border)",
  },
  amber: {
    background: "var(--accent-surface)",
    color: "var(--crust)",
    border: "1px solid var(--border)",
  },
  emerald: {
    background: "var(--accent-surface)",
    color: "var(--leaf)",
    border: "1px solid var(--border)",
  },
  rose: {
    background: "var(--accent-surface)",
    color: "var(--jam)",
    border: "1px solid var(--border)",
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
