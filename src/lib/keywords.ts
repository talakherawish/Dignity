import type { PayloadKeyword } from "@/lib/payload";

/** The populated keywords on an item, skipping any that arrived as bare ids. */
export const keywordsOf = (item: { keywords?: (PayloadKeyword | string)[] }) =>
  (item.keywords ?? []).filter((k): k is PayloadKeyword => typeof k === "object" && !!k);

/** In the reader's language when it exists, else the other -- a tag can't be blank. */
export const keywordLabel = (keyword: PayloadKeyword, isArabic: boolean) =>
  (isArabic ? (keyword.nameAr ?? keyword.name) : (keyword.name ?? keyword.nameAr)) ?? "";

/**
 * Folds the differences a searcher doesn't type: case, Latin accents, and the
 * Arabic letter variants (أ إ آ → ا, ة → ه, ى → ي) and short-vowel marks that
 * the same word is written with or without.
 */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ًͯ-ْٰ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
}

/**
 * Where a folded needle occurs in the original text, as [start, end) offsets
 * into that text -- so a match found through `fold` can be marked in the words
 * as written, accents and short vowels included.
 */
export function foldedMatches(text: string, needle: string): [number, number][] {
  if (!needle) return [];

  // Fold character by character, keeping the span of text each folded unit
  // came from. A mark that folds away joins the span of the letter before it.
  let folded = "";
  const spans: [number, number][] = [];
  let start = 0;
  for (const char of text) {
    const end = start + char.length;
    const units = fold(char);
    if (units) {
      folded += units;
      for (let i = 0; i < units.length; i++) spans.push([start, end]);
    } else if (spans.length) {
      spans[spans.length - 1][1] = end;
    }
    start = end;
  }

  const ranges: [number, number][] = [];
  let at = folded.indexOf(needle);
  while (at !== -1) {
    ranges.push([spans[at][0], spans[at + needle.length - 1][1]]);
    at = folded.indexOf(needle, at + needle.length);
  }
  return ranges;
}
