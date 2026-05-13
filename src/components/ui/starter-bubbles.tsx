"use client";

import { motion } from "framer-motion";

const bubbles = [
  { size: 6, duration: 1.5, delay: 0, left: "20%", bottom: "10%" },
  { size: 8, duration: 1.8, delay: 0.3, left: "50%", bottom: "20%" },
  { size: 10, duration: 2.0, delay: 0.6, left: "70%", bottom: "5%" },
  { size: 12, duration: 2.5, delay: 0.9, left: "35%", bottom: "15%" },
];

export function StarterBubbles() {
  return (
    <div className="relative w-10 h-10">
      {bubbles.map((bubble, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: bubble.left,
            bottom: bubble.bottom,
            background: "var(--accent)",
          }}
          animate={{
            scale: [0, 1, 1.1, 0],
            opacity: [0, 0.8, 0.6, 0],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
