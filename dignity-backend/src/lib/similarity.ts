/**
 * "Is this the same thing spelled slightly differently?" -- for bibliography
 * titles and keywords, which arrive typed by hand in two languages and so
 * drift: "Clientalism" / "Clientelism", "Human rights" / "Human-rights",
 * "الكرامة" / "الكرامه", a title with and without its subtitle.
 *
 * Exact duplicates (same text, ignoring case and spacing) are handled where
 * they occur -- skipped by the import, refused by the Keywords form. These
 * helpers find the near misses, which are only ever reported, never merged
 * automatically: two keywords one letter apart can be genuinely different.
 *
 * Plain TypeScript with no server imports, so the admin's client components
 * use it too.
 */

/**
 * Lowercase, without accents, Arabic short vowels or tatweel, with the Arabic
 * letters that are commonly typed interchangeably folded together (أ إ آ ٱ → ا,
 * ى → ي, ة → ه), and punctuation turned into single spaces.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function distance(a: string, b: string): number {
  if (a === b) return 0
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    previous = current
  }
  return previous[b.length]
}

/** Two keywords that are probably one: a typo, a plural, a hyphen apart. */
export function similarKeywords(a: string, b: string): boolean {
  const x = normalize(a)
  const y = normalize(b)
  if (!x || !y) return false
  if (x === y) return true
  const longest = Math.max(x.length, y.length)
  // Quick reject before the full comparison: lengths too far apart.
  if (Math.abs(x.length - y.length) > Math.max(2, longest * 0.15)) return false
  const d = distance(x, y)
  return (d <= 1 && longest >= 4) || (d <= 2 && longest >= 8) || 1 - d / longest >= 0.85
}

/** Two titles that are probably one source: a typo, punctuation, a dropped subtitle. */
export function similarTitles(a: string, b: string): boolean {
  const x = normalize(a)
  const y = normalize(b)
  if (!x || !y) return false
  if (x === y) return true
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  // The same title with a subtitle added -- long enough not to be a single
  // common word that many titles start with.
  if (short.length >= 15 && long.startsWith(short)) return true
  if (short.length / long.length < 0.8) return false
  return 1 - distance(x, y) / long.length >= 0.85
}

/** The same title, ignoring case, spacing, punctuation and letter variants. */
export const sameTitle = (a: string, b: string) => normalize(a) === normalize(b)
