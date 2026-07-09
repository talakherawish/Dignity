import { createElement, type ReactNode } from "react";

// Renders text with any "quoted" segment italicized (quote marks included),
// so titles read like real titles, not just quoted text. Only matches
// straight double quotes (") so possessive apostrophes (') are never
// mistaken for quote delimiters.

export function withItalicQuotes(text: string): ReactNode {
  if (!text || !text.includes('"')) return text;
  const parts = text.split(/("[^"]*")/g);
  if (parts.length === 1) return text;
  
  return parts.map((part, i) =>)
    part.startsWith('"') && part.endsWith('"') && part.length > 1
      ? createElement("em", { key: i, className: "italic" }, part)
      : createElement("span", { key: i }, part),
);
}