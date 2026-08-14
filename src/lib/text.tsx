import type { ReactNode } from "react";

/**
 * Matches any character from the Arabic script's Unicode blocks (including
 * Arabic Supplement and Presentation Forms, which cover the Persian/Urdu
 * extensions and ligatures this site's Arabic content can contain).
 *
 * Arabic has no true italic form — a CSS oblique slant breaks the letters'
 * cursive connections instead of the deliberate style change italics are in
 * Latin script — so nothing on the site should ever render Arabic text
 * italicized. Every place that would otherwise apply `italic` checks text
 * against this first.
 */
const ARABIC_SCRIPT = new RegExp(
  "[" +
    "؀-ۿ" + // Arabic
    "ݐ-ݿ" + // Arabic Supplement
    "ࢠ-ࣿ" + // Arabic Extended-A
    "ﭐ-﷿" + // Arabic Presentation Forms-A
    "ﹰ-﻿" + // Arabic Presentation Forms-B
    "]",
);

export function containsArabic(text: string): boolean {
  return ARABIC_SCRIPT.test(text);
}

/**
 * Renders text with any "quoted" segment italicized (quote marks included),
 * so titles like `Discussion of Raef Zreik's Book — "Kant's Struggle for
 * Independence"` get their embedded title visually set apart — not just
 * quoted, but styled like a real title. A quoted segment written in Arabic
 * keeps its upright style instead — see containsArabic above.
 *
 * Only matches straight double quotes (") so possessive apostrophes (') in
 * surrounding text are never mistaken for quote delimiters.
 */
export function withItalicQuotes(text: string): ReactNode {
  if (!text || !text.includes('"')) return text;

  const parts = text.split(/("[^"]*")/g);
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    part.startsWith('"') && part.endsWith('"') && part.length > 1 && !containsArabic(part) ? (
      <em key={i} className="italic">
        {part}
      </em>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
