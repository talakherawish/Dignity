import { useSyncExternalStore } from "react";
import type { CitationStyle } from "./citation";

/**
 * The citation style the reader picked on a Databases page: one choice for
 * every entry, remembered in their browser for next time. The server always
 * renders Chicago; the browser switches to the remembered style once it loads.
 */

const KEY = "citation-style";
const listeners = new Set<() => void>();
let current: CitationStyle | undefined;

function read(): CitationStyle {
  if (!current) {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      // Storage blocked: the choice lasts as long as the page.
    }
    current = stored === "apa" || stored === "mla" ? stored : "chicago";
  }
  return current;
}

function choose(style: CitationStyle) {
  current = style;
  try {
    localStorage.setItem(KEY, style);
  } catch {
    // As above.
  }
  listeners.forEach((listener) => listener());
}

export function useCitationStyle(): [CitationStyle, (style: CitationStyle) => void] {
  const style = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    (): CitationStyle => "chicago",
  );
  return [style, choose];
}
