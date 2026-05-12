export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "amber" | "emerald" | "rose";
}) {
  const styles = {
    default: "bg-stone-800 text-stone-400",
    amber: "bg-amber-900/30 text-amber-400",
    emerald: "bg-emerald-900/30 text-emerald-400",
    rose: "bg-rose-900/30 text-rose-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
