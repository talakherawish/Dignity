/**
 * What the two spreadsheet imports share -- annotated bibliographies into a
 * database (bibliographyImport.ts) and readings into a Readings and Documents
 * subject (readingsImport.ts): reading cells, matching and creating keywords,
 * catching duplicate and similar rows, and the report.
 */
import type { Payload } from 'payload'
import { sameTitle, similarKeywords, similarTitles } from './similarity'
import type { Row } from './xlsx'

export type ImportReport = {
  created: number
  skipped: string[]
  failed: string[]
  keywordsUsed: number
  /** Keywords the sheet gave in one language only, so created without a translation. */
  unpaired: string[]
  /** Rows imported whose title is close to another item's. */
  similarEntries: string[]
  /** New keywords spelled close to another keyword. */
  similarKeywords: string[]
}

export const emptyReport = (): ImportReport => ({
  created: 0,
  skipped: [],
  failed: [],
  keywordsUsed: 0,
  unpaired: [],
  similarEntries: [],
  similarKeywords: [],
})

export const split = (value: string | undefined) =>
  (value ?? '')
    .split('|')
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
export const tidy = (value: string | undefined) => (value ?? '').replace(/\s+/g, ' ').trim()
export const key = (value: string) => tidy(value).toLowerCase()
export const isArabic = (value: string) => /[؀-ۿ]/.test(value)

/** The first of these columns the row has a value in. */
export const firstOf = (row: Row, ...columns: string[]) =>
  columns.map((column) => tidy(row[column])).find(Boolean) ?? ''

/**
 * Atlas refuses the first writes to a brand-new collection while it is still
 * creating it ("catalog changes", labelled TransientTransactionError), so each
 * write is retried a few times before giving up. A failed write's transaction
 * is rolled back, so retrying can't leave a half-saved item.
 */
export async function retried<T>(write: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await write()
    } catch (error) {
      const transient = (error as { errorLabelSet?: Set<string> }).errorLabelSet?.has(
        'TransientTransactionError',
      )
      if (!transient || attempt === 5) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}

/**
 * Keywords for one import: the optional "Keywords" sheet pairs each English
 * keyword with its Arabic; every keyword a row uses is matched to an existing
 * one (ignoring case) or created, and one spelled close to another is noted.
 *
 * Every keyword there is is loaded once -- a few hundred short names -- so
 * each word in the sheet is checked against all of them, and against the
 * ones this import creates.
 */
export async function keywordResolver(
  payload: Payload,
  sheets: Map<string, Row[]>,
  dryRun: boolean,
) {
  type Pair = { name?: string; nameAr?: string }
  const pairByKey = new Map<string, Pair>()
  for (const row of sheets.get('Keywords') ?? []) {
    const name = tidy(row.English)
    const nameAr = tidy(row.Arabic)
    if ((name && pairByKey.has(key(name))) || (nameAr && pairByKey.has(key(nameAr)))) continue
    const pair = { name: name || undefined, nameAr: nameAr || undefined }
    if (name) pairByKey.set(key(name), pair)
    if (nameAr) pairByKey.set(key(nameAr), pair)
  }

  const unpaired = new Set<string>()
  const keywordIds = new Map<string, string>()
  const similarNotes: string[] = []

  type Known = { id: string; name?: string; nameAr?: string; isNew?: boolean }
  const known: Known[] = (
    await payload.find({ collection: 'keywords', pagination: false, depth: 0 })
  ).docs.map((doc) => ({
    id: String(doc.id),
    name: doc.name ?? undefined,
    nameAr: doc.nameAr ?? undefined,
  }))

  /** The id of the keyword spelled this way, creating it (and its pair) if new. */
  async function keywordId(raw: string): Promise<string> {
    const text = tidy(raw)
    const already = keywordIds.get(key(text))
    if (already) return already

    const pair: Pair =
      pairByKey.get(key(text)) ?? (isArabic(text) ? { nameAr: text } : { name: text })
    if (!pairByKey.has(key(text))) unpaired.add(text)

    const sides = (['name', 'nameAr'] as const).filter((side) => pair[side])
    let match: Known | undefined
    for (const side of sides) {
      match = known.find((k) => k[side] && key(k[side]!) === key(pair[side]!))
      if (!match) continue
      // Fill in a missing translation on a keyword that already exists.
      const other = side === 'name' ? 'nameAr' : 'name'
      if (pair[other] && !match[other]) {
        if (!dryRun) {
          const id = match.id
          await retried(() =>
            payload.update({ collection: 'keywords', id, data: { [other]: pair[other] } }),
          )
        }
        match[other] = pair[other]
      }
      break
    }

    if (!match) {
      // Not the same as any keyword -- but maybe one letter or a hyphen away.
      const label = [pair.name, pair.nameAr].filter(Boolean).join(' / ')
      for (const side of sides) {
        for (const k of known) {
          if (k[side] && similarKeywords(k[side]!, pair[side]!)) {
            const whose = k.isNew ? 'another new keyword from this sheet' : 'the existing keyword'
            similarNotes.push(`"${label}" looks like ${whose} "${k[side]}"`)
          }
        }
      }
      const id = dryRun
        ? `new:${text}`
        : String(
            (
              await retried(() =>
                payload.create({
                  collection: 'keywords',
                  data: { name: pair.name, nameAr: pair.nameAr },
                }),
              )
            ).id,
          )
      match = { id, name: pair.name, nameAr: pair.nameAr, isNew: true }
      known.push(match)
    }
    for (const side of sides) keywordIds.set(key(pair[side]!), match.id)
    return match.id
  }

  /** The keyword ids for one cell of |-separated keywords. */
  async function keywordIdsFor(cell: string | undefined): Promise<string[]> {
    const ids: string[] = []
    for (const word of split(cell)) {
      const id = await keywordId(word)
      if (!ids.includes(id)) ids.push(id)
    }
    return ids
  }

  /** Writes the keyword findings into the report, once every row is done. */
  function finish(report: ImportReport) {
    report.keywordsUsed = new Set(keywordIds.values()).size
    report.unpaired = [...unpaired].sort((a, b) => a.localeCompare(b))
    report.similarKeywords = [...new Set(similarNotes)]
  }

  return { keywordIdsFor, finish }
}

/**
 * Duplicate checking for one import: every item already in the subject,
 * drafts included, then each row as it is imported. A row with the same title
 * (ignoring case, punctuation and letter variants) and year is a duplicate,
 * to skip; one with a close title is imported but noted.
 */
export function duplicateChecker(
  existing: { title?: string | null; year?: string | null }[],
  subject: string,
) {
  type Seen = { title: string; year: string; where: string }
  const seen: Seen[] = existing.map((doc) => ({
    title: doc.title ?? '',
    year: tidy(doc.year ?? ''),
    where: `already in this ${subject}`,
  }))

  return {
    /** True if the row is a duplicate (and was noted as skipped). */
    isDuplicate(report: ImportReport, rowNumber: number, title: string, year: string) {
      const duplicate = seen.find((s) => s.year === year && sameTitle(s.title, title))
      if (duplicate) {
        report.skipped.push(`Row ${rowNumber}, ${duplicate.where}: ${title}`)
        return true
      }
      const yearOf = (y: string) => (y ? ` (${y})` : '')
      for (const s of seen.filter((s) => similarTitles(s.title, title))) {
        report.similarEntries.push(
          `Row ${rowNumber}: "${title}"${yearOf(year)} looks like "${s.title}"${yearOf(s.year)}, ${s.where}`,
        )
      }
      return false
    },
    /** Records an imported row, for the rows after it to be checked against. */
    add(rowNumber: number, title: string, year: string) {
      seen.push({ title, year, where: `as row ${rowNumber} of this sheet` })
    },
  }
}

/** The report as plain text, for the admin's read-only field and the console. */
export function formatReport(report: ImportReport, dryRun = false, items = 'entries'): string {
  const lines = [
    `${dryRun ? 'Would create' : 'Created'} ${report.created} ${items}.`,
    `Skipped ${report.skipped.length}. Failed ${report.failed.length}.`,
    `Keywords used: ${report.keywordsUsed}.`,
  ]
  if (report.similarEntries.length || report.similarKeywords.length) {
    lines.push(
      `To check: ${report.similarEntries.length} similar ${items}, ${report.similarKeywords.length} similar keywords (listed below).`,
    )
  }
  if (report.failed.length) lines.push('', 'Failed:', ...report.failed.map((l) => `  ${l}`))
  if (report.skipped.length) {
    lines.push(
      '',
      'Skipped -- exact duplicates (same title and year) or rows without a title:',
      ...report.skipped.map((l) => `  ${l}`),
    )
  }
  if (report.similarEntries.length) {
    lines.push(
      '',
      `Similar ${items} -- ${dryRun ? 'would be imported' : 'imported'}, but check whether each is the same source as the one it looks like, and delete one if so:`,
      ...report.similarEntries.map((l) => `  ${l}`),
    )
  }
  if (report.similarKeywords.length) {
    lines.push(
      '',
      `Similar keywords -- ${dryRun ? 'would be created' : 'created'}, but check whether each means the same as the one it looks like (the Keywords list shows every such pair at the top):`,
      ...report.similarKeywords.map((l) => `  ${l}`),
    )
  }
  if (report.unpaired.length) {
    lines.push(
      '',
      `${report.unpaired.length} keywords had no translation in the sheet's Keywords tab, so they exist in one language only -- add the other under Keywords:`,
      ...report.unpaired.map((word) => `  ${word}`),
    )
  }
  return lines.join('\n')
}
