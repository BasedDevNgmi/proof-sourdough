"use client";

import { Fragment } from "react";
import { glossary } from "@/data/glossary";
import { Term } from "@/components/ui/term";

const allTerms = glossary.flatMap((e) => [e.term, ...(e.aliases || [])]);
const sortedTerms = allTerms.sort((a, b) => b.length - a.length);
const termPattern = new RegExp(
  `\\b(${sortedTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi"
);

export function GlossaryText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const parts: { text: string; isTerm: boolean }[] = [];
  let lastIndex = 0;
  const matched = new Set<string>();

  let match: RegExpExecArray | null;
  termPattern.lastIndex = 0;
  while ((match = termPattern.exec(text)) !== null) {
    const termKey = match[1].toLowerCase();
    if (matched.has(termKey)) continue;
    matched.add(termKey);

    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isTerm: false });
    }
    parts.push({ text: match[1], isTerm: true });
    lastIndex = match.index + match[1].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isTerm: false });
  }

  if (parts.length === 0) return <span className={className} style={style}>{text}</span>;

  return (
    <span className={className} style={style}>
      {parts.map((part, i) =>
        part.isTerm ? (
          <Term key={i}>{part.text}</Term>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        )
      )}
    </span>
  );
}
