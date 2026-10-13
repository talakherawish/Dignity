import { useLayoutEffect, useRef, type ReactNode } from "react";
import { foldedMatches } from "@/lib/keywords";

/**
 * The text with every match of the folded search marked, in the words as
 * written. A mark sweeps in once, when its match first appears, then stays
 * put and simply takes on each letter as the search is typed.
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
    // Only a new mark sweeps in. One that grows or shrinks as the search is
    // typed just takes its new letters, with no animation.
    if (!el || before) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate([{ backgroundSize: "0% 100%" }, { backgroundSize: "100% 100%" }], {
      duration: 600,
      easing: SWEEP_EASING,
    });
  }, [text]);

  return (
    <mark ref={ref} className="search-mark rounded-sm">
      {text}
    </mark>
  );
}
