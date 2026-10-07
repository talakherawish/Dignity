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
