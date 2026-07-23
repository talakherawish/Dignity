import type { ReactNode } from "react";

/**
 * Renders text with any "quoted" segment italicized (quote marks included),
 * so titles like `Discussion of Raef Zreik's Book — "Kant's Struggle for
 * Independence"` get their embedded title visually set apart — not just
 * quoted, but styled like a real title.
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
      <em key={i} className="italic">
        {part}
      </em>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
