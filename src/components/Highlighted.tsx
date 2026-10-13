import type { ReactNode } from "react";
import { foldedMatches } from "@/lib/keywords";

/**
 * The text with every match of the folded search marked, in the words as
 * written. Each new search draws its marks afresh, so they sweep in again.
 */
export function Highlighted({ text, needles }: { text: string; needles: string[] }) {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [start, end] of foldedMatches(text, needles)) {
    if (start > at) parts.push(text.slice(at, start));
    parts.push(
      <mark key={`${needles[0]}:${start}`} className="search-mark rounded-sm">
        {text.slice(start, end)}
      </mark>,
    );
    at = end;
  }
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}
