import type { ReactNode } from "react";

/**
 * Matches any character from the Arabic script's Unicode blocks (including
 * Arabic Supplement and Presentation Forms, which cover the Persian/Urdu
 * extensions and ligatures this site's Arabic content can contain).
 *
 * Arabic has no true italic form — a CSS oblique slant breaks the letters'
 * cursive connections instead of the deliberate style change italics are in
 * Latin script — so nothing on the site should ever render Arabic text
 * italicized. Arabic print sets that emphasis (a book's title, a quotation)
 * in bold instead, and so does the site: every place that would otherwise
 * apply `italic` checks text against this first and uses ARABIC_EMPHASIS.
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

/** What Arabic text gets where Latin text would be italic. */
export const ARABIC_EMPHASIS = "font-semibold";

/** The class for emphasised text: italic, or bold for Arabic. */
export const emphasis = (arabic: boolean) => (arabic ? ARABIC_EMPHASIS : "italic");

/**
 * Renders text with any "quoted" segment italicized (quote marks included),
 * so titles like `Discussion of Raef Zreik's Book — "Kant's Struggle for
 * Independence"` get their embedded title visually set apart — not just
 * quoted, but styled like a real title. A quoted segment written in Arabic
 * is set in bold instead — see containsArabic above.
 *
 * Only matches straight double quotes (") so possessive apostrophes (') in
 * surrounding text are never mistaken for quote delimiters.
 */
export function withItalicQuotes(text: string): ReactNode {
  if (!text || !text.includes('"')) return text;

  const parts = text.split(/("[^"]*")/g);
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    part.startsWith('"') && part.endsWith('"') && part.length > 1 ? (
      <em key={i} className={emphasis(containsArabic(part))}>
        {part}
      </em>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
