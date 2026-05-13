"use client";

import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
  scriptTag,
}: {
  title: string;
  subtitle?: string;
  scriptTag?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="proof-page pb-6"
      style={{ paddingBottom: 24 }}
    >
      <h1
        className="display"
        style={{ fontSize: 68, margin: 0, marginBottom: 4, color: "var(--ink)" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm mt-1.5 lg:text-base" style={{ color: "var(--ink-mute)" }}>
          {subtitle}
          {scriptTag && (
            <>
              {" · "}
              <span className="script" style={{ fontSize: 18, color: "var(--crust)" }}>
                {scriptTag}
              </span>
            </>
          )}
        </p>
      )}
    </motion.div>
  );
}
