"use client";

import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="px-5 pt-14 pb-4"
    >
      <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-tight text-stone-100">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      )}
    </motion.div>
  );
}
