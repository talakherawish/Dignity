/**
 * Turns an annotated-bibliography spreadsheet into Bibliography Entries in one
 * database, tagged with Keywords (src/collections/Bibliography.ts). What it
 * creates are ordinary entries and keywords -- editable, publishable and
 * deletable in the admin like any other item; nothing ties them to the sheet
 * afterwards.
 *
 * Run from the admin by Spreadsheet Imports (src/collections/BibliographyImports.ts)
 * and from the command line by scripts/import-bibliography.ts.
 *
 * The sheet is the team's Zotero export: Type, Lang, Keywords, Names, Title,
 * Book_title, Journal_name, Report_type, Website_name, Date_accessed, Year,
 * City, Publisher, Page_url, Pages, Volume, Issue, Edition, URL, DOI, Editors,
 * Annotations -- multiple names, places and keywords separated by "|". Two
 * optional extras are understood too:
 *   - a sheet named "Keywords" with English and Arabic columns, which pairs
 *     up the two languages of each keyword;
 *   - the "Copyright status", "website actiom", "format" and "source/access
 *     note" columns from the readings list, kept on each entry for the team.
 *
 * Safe to run again: an entry already in the database with the same title and
 * year is skipped, and keywords are matched to existing ones (ignoring case)
 * before any is created.
 */
import type { Payload } from 'payload'
import { readWorkbook, type Row } from './xlsx'

export type ImportReport = {
  created: number
  skipped: string[]
  failed: string[]
  keywordsUsed: number
  /** Keywords the sheet gave in one language only, so created without a translation. */
  unpaired: string[]
}

export const ENTRY_COLUMNS = ['Type', 'Names']

const split = (value: string | undefined) =>
  (value ?? '')
    .split('|')
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
const tidy = (value: string | undefined) => (value ?? '').replace(/\s+/g, ' ').trim()
const key = (value: string) => tidy(value).toLowerCase()
const isArabic = (value: string) => /[؀-ۿ]/.test(value)

const TYPES: Record<string, string> = {
  book: 'book',
  'book chapter': 'bookChapter',
  'journal article': 'journalArticle',
  'other article': 'otherArticle',
  report: 'report',
  thesis: 'thesis',
  'from website': 'website',
  website: 'website',
}

const COPYRIGHT: Record<string, string> = {
  copyrighted: 'copyrighted',
  'copyrighted / verify': 'verify',
  'public domain*': 'publicDomain',
  'public domain': 'publicDomain',
  'open access / verify licence': 'openAccess',
  'web content / verify terms': 'webContent',
}

/**
 * Atlas refuses the first writes to a brand-new collection while it is still
 * creating it ("catalog changes", labelled TransientTransactionError), so each
 * write is retried a few times before giving up. A failed write's transaction
 * is rolled back, so retrying can't leave a half-saved entry.
 */
async function retried<T>(write: () => Promise<T>): Promise<T> {
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
 * A source with a URL is linked; anything else is a citation. "Upload" in the
 * readings list can't be honoured from a sheet -- there's no file -- so it's
 * noted for the team instead, and the file can be attached in the admin.
 */
function access(row: Row): { access: string; note?: string } {
  const action = key(row['website actiom'] ?? row['website action'] ?? '')
  const linked = tidy(row.URL || row.Page_url) ? 'link' : 'citation'
  return action === 'upload'
    ? { access: linked, note: 'Marked for upload -- no file attached yet.' }
    : { access: linked }
}

export async function importBibliography({
  payload,
  file,
  database,
  publish = false,
  dryRun = false,
}: {
  payload: Payload
  file: Buffer
  /** The id of the Databases item the entries go into. */
  database: string
  /** Publish the entries straight away rather than saving them as drafts. */
  publish?: boolean
  /** Read everything and report, but write nothing. */
  dryRun?: boolean
}): Promise<ImportReport> {
  const sheets = readWorkbook(file)
  const entrySheet = [...sheets.values()].find(
    (rows) => rows[0] && ENTRY_COLUMNS.every((column) => column in rows[0]),
  )
  if (!entrySheet) {
    throw new Error(
      `No sheet has the bibliography columns (${ENTRY_COLUMNS.join(', ')}, Title, Year, ...) in its first row.`,
    )
  }

  // --- Keywords: the pairs sheet first, then whatever the entries use. ---

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

  /** The id of the keyword spelled this way, creating it (and its pair) if new. */
  async function keywordId(raw: string): Promise<string> {
    const text = tidy(raw)
    const known = keywordIds.get(key(text))
    if (known) return known

    const pair: Pair =
      pairByKey.get(key(text)) ?? (isArabic(text) ? { nameAr: text } : { name: text })
    if (!pairByKey.has(key(text))) unpaired.add(text)

    const sides = (['name', 'nameAr'] as const).filter((side) => pair[side])
    let id: string | undefined
    for (const side of sides) {
      const { docs } = await payload.find({
        collection: 'keywords',
        where: { [side]: { like: pair[side] } },
        pagination: false,
        depth: 0,
      })
      const match = docs.find((doc) => key(String(doc[side] ?? '')) === key(pair[side]!))
      if (!match) continue
      id = String(match.id)
      // Fill in a missing translation on a keyword that already exists.
      const other = side === 'name' ? 'nameAr' : 'name'
      if (pair[other] && !match[other] && !dryRun) {
        await retried(() =>
          payload.update({ collection: 'keywords', id: match.id, data: { [other]: pair[other] } }),
        )
      }
      break
    }
    if (!id) {
      id = dryRun
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
    }
    for (const side of sides) keywordIds.set(key(pair[side]!), id)
    return id
  }

  // --- Entries ---

  const report: ImportReport = {
    created: 0,
    skipped: [],
    failed: [],
    keywordsUsed: 0,
    unpaired: [],
  }

  for (const row of entrySheet) {
    const ownTitle = tidy(row.Title)
    const bookTitle = tidy(row.Book_title)
    const title = ownTitle || bookTitle
    if (!title) {
      report.skipped.push(`No title: ${tidy(row.Names) || '(empty row)'}`)
      continue
    }
    const year = tidy(row.Year)

    try {
      const { docs: existing } = await payload.find({
        collection: 'bibliography-entries',
        where: {
          and: [
            { database: { equals: database } },
            { title: { equals: title } },
            { year: { equals: year } },
          ],
        },
        draft: true,
        limit: 1,
        depth: 0,
      })
      if (existing[0]) {
        report.skipped.push(`Already in this database: ${title}`)
        continue
      }

      const lang = key(row.Lang)
      const { access: accessValue, note } = access(row)
      const internalNote = [
        note,
        tidy(row['source/access note']),
        tidy(row.format) && `Format: ${tidy(row.format)}`,
      ]
        .filter(Boolean)
        .join('\n')

      const keywords: string[] = []
      for (const word of split(row.Keywords)) {
        const id = await keywordId(word)
        if (!keywords.includes(id)) keywords.push(id)
      }

      const data = {
        database,
        entryType: TYPES[key(row.Type)] ?? 'other',
        language: lang.startsWith('ar') ? 'ar' : lang.startsWith('en') || !lang ? 'en' : 'other',
        isTranslation: /\(tr\)/.test(lang),
        title,
        authors: split(row.Names).map((name) => ({ name })),
        // A whole book's title is the title itself; a chapter's book, or an
        // article's journal or website, is where it was published.
        containerTitle:
          (ownTitle ? bookTitle : '') ||
          tidy(row.Journal_name) ||
          tidy(row.Website_name) ||
          undefined,
        editors: split(row.Editors).map((name) => ({ name })),
        year: year || undefined,
        publisher: tidy(row.Publisher) || undefined,
        city: split(row.City).join('; ') || undefined,
        volume: tidy(row.Volume) || undefined,
        issue: tidy(row.Issue) || undefined,
        pages: tidy(row.Pages).replace(/\.$/, '') || undefined,
        edition: tidy(row.Edition) || undefined,
        reportType: tidy(row.Report_type) || undefined,
        url: tidy(row.URL || row.Page_url) || undefined,
        doi: tidy(row.DOI) || undefined,
        dateAccessed: tidy(row.Date_accessed) || undefined,
        annotation: (row.Annotations ?? '').trim() || undefined,
        keywords: dryRun ? [] : keywords,
        access: accessValue,
        copyrightStatus: COPYRIGHT[key(row['Copyright status'] ?? '')] || undefined,
        internalNote: internalNote || undefined,
        _status: publish ? 'published' : 'draft',
      }

      if (!dryRun) {
        await retried(() =>
          payload.create({
            collection: 'bibliography-entries',
            data: data as never,
            draft: !publish,
          }),
        )
      }
      report.created++
    } catch (error) {
      report.failed.push(`${title}: ${(error as Error).message}`)
    }
  }

  report.keywordsUsed = new Set(keywordIds.values()).size
  report.unpaired = [...unpaired].sort((a, b) => a.localeCompare(b))
  return report
}

/** The report as plain text, for the admin's read-only field and the console. */
export function formatReport(report: ImportReport, dryRun = false): string {
  const lines = [
    `${dryRun ? 'Would create' : 'Created'} ${report.created} entries.`,
    `Skipped ${report.skipped.length}. Failed ${report.failed.length}.`,
    `Keywords used: ${report.keywordsUsed}.`,
  ]
  if (report.failed.length) lines.push('', 'Failed:', ...report.failed.map((l) => `  ${l}`))
  if (report.skipped.length) lines.push('', 'Skipped:', ...report.skipped.map((l) => `  ${l}`))
  if (report.unpaired.length) {
    lines.push(
      '',
      `${report.unpaired.length} keywords had no translation in the sheet's Keywords tab, so they exist in one language only -- add the other under Keywords:`,
      ...report.unpaired.map((word) => `  ${word}`),
    )
  }
  return lines.join('\n')
}
