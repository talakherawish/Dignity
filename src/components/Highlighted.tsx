import { useLayoutEffect, useRef, type ReactNode } from "react";
import { foldedMatches } from "@/lib/keywords";

/**
 * The text with every match of the folded search marked, in the words as
 * written. A mark stays put while its match grows, so typing on only sweeps
 * the highlighter over the newly matched letters.
 */
export function Highlighted({ text, needles }: { text: string; needles: string[] }) {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [start, end] of foldedMatches(text, needles)) {
    if (start > at) parts.push(text.slice(at, start));
    parts.push(<SearchMark key={start} text={text.slice(start, end)} />);
    at = end;
  }
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}

const SWEEP_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";

function SearchMark({ text }: { text: string }) {
  const ref = useRef<HTMLElement>(null);
  const shown = useRef("");

  useLayoutEffect(() => {
    const el = ref.current;
    const before = shown.current;
    shown.current = text;
    if (!el || before === text) return;
    // Shrinking (backspace) just cuts the mark back; no sweep.
    if (before.startsWith(text)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Carry on from where the last sweep reached, if this match extends it.
    const from = before && text.startsWith(before) ? before.length / text.length : 0;
    el.animate(
      [{ backgroundSize: `${from * 100}% 100%` }, { backgroundSize: "100% 100%" }],
      { duration: from ? 300 : 600, easing: SWEEP_EASING },
    );
  }, [text]);

  return (
    <mark ref={ref} className="search-mark rounded-sm">
      {text}
    </mark>
  );
}
