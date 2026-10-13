import type { ReactNode } from "react";
import { foldedMatches } from "@/lib/keywords";

/** The text with every match of a folded search marked, in the words as written. */
export function Highlighted({ text, needle }: { text: string; needle: string }) {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [start, end] of foldedMatches(text, needle)) {
    if (start > at) parts.push(text.slice(at, start));
    parts.push(
      <mark
        key={start}
        className="rounded-sm bg-[color:var(--brand-magenta)]/15 text-[color:var(--brand-magenta)]"
      >
        {text.slice(start, end)}
      </mark>,
    );
    at = end;
  }
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}
