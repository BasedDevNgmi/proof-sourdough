const variants = {
  default: "bg-stone-800/80 text-stone-300",
  amber: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  emerald: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  rose: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
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
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
