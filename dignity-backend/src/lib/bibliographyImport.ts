/**
 * Turns an annotated-bibliography spreadsheet into Bibliography Entries in one
 * database, tagged with Keywords (src/collections/Bibliography.ts). What it
 * creates are ordinary entries and keywords -- editable, publishable and
 * deletable in the admin like any other item; nothing ties them to the sheet
 * afterwards.
 *
 * Run from the admin by Spreadsheet Imports (src/collections/SpreadsheetImports.ts)
 * and from the command line by scripts/import-bibliography.ts.
 *
 * The sheet is the team's Zotero export: Type, Lang, Keywords, Names, Title,
 * Book_title, Journal_name, Report_type, Website_name, Date_accessed, Year,
 * City, Publisher, Page_url, Pages, Volume, Issue, Edition, URL, DOI, Editors,
 * Annotations, Annotations_ar (the Arabic annotation), Internal note -- multiple names, places and keywords separated by "|". Two
 * optional extras are understood too:
 *   - a sheet named "Keywords" with English and Arabic columns, which pairs
 *     up the two languages of each keyword;
 *   - the "Copyright status", "website actiom", "format" and "source/access
 *     note" columns from the readings list, kept on each entry for the team.
 *
 * Safe to run again: an entry already in the database -- or earlier in the
 * same sheet -- with the same title and year is skipped, and keywords are
 * matched to existing ones (ignoring case) before any is created.
 *
 * Near misses are imported but reported (src/lib/similarity.ts): a row whose
 * title is close to one already there, or a new keyword spelled close to an
 * existing one ("Clientalism" beside "Clientelism"), so the team can check
 * whether they are the same thing. A "Check only" import shows all of this
 * before anything is written.
 *
 * exportBibliography (at the end) goes the other way: a database's entries
 * written out as the same sheet, so a file exported here can be edited and
 * imported again.
 */
import type { Payload } from 'payload'
import {
  duplicateChecker,
  emptyReport,
  formatReport,
  key,
  keywordResolver,
  retried,
  split,
  tidy,
  type ImportReport,
} from './importShared'
import { readWorkbook, writeWorkbook, type Row } from './xlsx'

export { formatReport, type ImportReport }

export const ENTRY_COLUMNS = ['Type', 'Names']

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

  const keywords = await keywordResolver(payload, sheets, dryRun)
  const report = emptyReport()
  const duplicates = duplicateChecker(
    (
      await payload.find({
        collection: 'bibliography-entries',
        where: { database: { equals: database } },
        draft: true,
        pagination: false,
        depth: 0,
        select: { title: true, year: true },
      })
    ).docs,
    'database',
  )

  for (const [index, row] of entrySheet.entries()) {
    // The sheet's own row number: its first row holds the column names.
    const rowNumber = index + 2
    const ownTitle = tidy(row.Title)
    const bookTitle = tidy(row.Book_title)
    const title = ownTitle || bookTitle
    if (!title) {
      report.skipped.push(`Row ${rowNumber}, no title: ${tidy(row.Names) || '(empty row)'}`)
      continue
    }
    const year = tidy(row.Year)

    try {
      if (duplicates.isDuplicate(report, rowNumber, title, year)) continue

      const lang = key(row.Lang)
      const { access: accessValue, note } = access(row)
      const internalNote = [
        note,
        tidy(row['Internal note']),
        tidy(row['source/access note']),
        tidy(row.format) && `Format: ${tidy(row.format)}`,
      ]
        .filter(Boolean)
        .join('\n')

      const keywordIds = await keywords.keywordIdsFor(row.Keywords)

      const data = {
        database,
        entryType: TYPES[key(row.Type)] ?? 'other',
        language: lang.startsWith('ar') ? 'ar' : lang.startsWith('en') || !lang ? 'en' : 'other',
        isTranslation: /\(tr\)|translation/.test(lang),
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
        annotationAr: (row.Annotations_ar ?? '').trim() || undefined,
        keywords: dryRun ? [] : keywordIds,
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
      duplicates.add(rowNumber, title, year)
    } catch (error) {
      report.failed.push(`Row ${rowNumber}, ${title}: ${(error as Error).message}`)
    }
  }

  keywords.finish(report)
  return report
}

// ---------------------------------------------------------------------------
// Export: the reverse of the import, column for column.

/** The import's columns, in the order the team's sheets use them. */
const EXPORT_COLUMNS = [
  'Type',
  'Lang',
  'Keywords',
  'Names',
  'Title',
  'Book_title',
  'Journal_name',
  'Report_type',
  'Website_name',
  'Date_accessed',
  'Year',
  'City',
  'Publisher',
  'Pages',
  'Volume',
  'Issue',
  'Edition',
  'URL',
  'DOI',
  'Editors',
  'Annotations',
  'Annotations_ar',
  'Copyright status',
  'website action',
  'Internal note',
]

const TYPE_NAMES: Record<string, string> = {
  book: 'Book',
  bookChapter: 'Book chapter',
  journalArticle: 'Journal article',
  otherArticle: 'Other article',
  report: 'Report',
  thesis: 'Thesis',
  website: 'From website',
  other: 'Other',
}

const COPYRIGHT_NAMES: Record<string, string> = {
  copyrighted: 'Copyrighted',
  verify: 'Copyrighted / verify',
  publicDomain: 'Public domain',
  openAccess: 'Open access / verify licence',
  webContent: 'Web content / verify terms',
}

const ACCESS_NAMES: Record<string, string> = {
  citation: 'Bibliographic entry',
  link: 'Link only',
  upload: 'Upload',
}

type ExportedKeyword = { id: string | number; name?: string | null; nameAr?: string | null }
type ExportedEntry = {
  entryType?: string | null
  language?: string | null
  isTranslation?: boolean | null
  title?: string | null
  authors?: { name?: string | null }[] | null
  editors?: { name?: string | null }[] | null
  containerTitle?: string | null
  year?: string | null
  publisher?: string | null
  city?: string | null
  volume?: string | null
  issue?: string | null
  pages?: string | null
  edition?: string | null
  reportType?: string | null
  url?: string | null
  doi?: string | null
  dateAccessed?: string | null
  annotation?: string | null
  annotationAr?: string | null
  keywords?: (ExportedKeyword | string | number)[] | null
  access?: string | null
  copyrightStatus?: string | null
  internalNote?: string | null
}

/**
 * Every entry in a database -- drafts included -- as an .xlsx in the import's
 * own format, plus a "Keywords" sheet pairing each keyword used with its
 * translation. Importing the file again into the same database skips every
 * row already there (same title and year); into an empty one, it recreates
 * the entries.
 */
export async function exportBibliography(payload: Payload, database: string): Promise<Buffer> {
  const { docs } = await payload.find({
    collection: 'bibliography-entries',
    where: { database: { equals: database } },
    draft: true,
    pagination: false,
    depth: 1,
    sort: 'title',
  })

  const keywords = new Map<string, ExportedKeyword>()
  const rows = (docs as ExportedEntry[]).map((entry) => {
    const tags = (entry.keywords ?? []).filter(
      (k): k is ExportedKeyword => typeof k === 'object' && k !== null,
    )
    for (const tag of tags) keywords.set(String(tag.id), tag)
    const names = (list: { name?: string | null }[] | null | undefined) =>
      (list ?? [])
        .map((item) => item.name ?? '')
        .filter(Boolean)
        .join('|')

    // Where the entry was published goes back into the column the import
    // reads it from: a chapter's book, an article's journal, a page's website.
    const type = entry.entryType ?? 'other'
    const container = entry.containerTitle ?? ''
    const article = type === 'journalArticle' || type === 'otherArticle'

    const row: Record<string, string> = {
      Type: TYPE_NAMES[type] ?? 'Other',
      Lang: `${entry.language ?? 'en'}${entry.isTranslation ? ' (tr)' : ''}`,
      Keywords: tags
        .map((tag) => tag.name || tag.nameAr || '')
        .filter(Boolean)
        .join('|'),
      Names: names(entry.authors),
      Title: entry.title ?? '',
      Book_title: !article && type !== 'website' ? container : '',
      Journal_name: article ? container : '',
      Report_type: entry.reportType ?? '',
      Website_name: type === 'website' ? container : '',
      Date_accessed: entry.dateAccessed ?? '',
      Year: entry.year ?? '',
      City: (entry.city ?? '').split(/;\s*/).filter(Boolean).join('|'),
      Publisher: entry.publisher ?? '',
      Pages: entry.pages ?? '',
      Volume: entry.volume ?? '',
      Issue: entry.issue ?? '',
      Edition: entry.edition ?? '',
      URL: entry.url ?? '',
      DOI: entry.doi ?? '',
      Editors: names(entry.editors),
      Annotations: entry.annotation ?? '',
      Annotations_ar: entry.annotationAr ?? '',
      'Copyright status': COPYRIGHT_NAMES[entry.copyrightStatus ?? ''] ?? '',
      'website action': ACCESS_NAMES[entry.access ?? ''] ?? '',
      'Internal note': entry.internalNote ?? '',
    }
    return EXPORT_COLUMNS.map((column) => row[column])
  })

  const keywordRows = [...keywords.values()]
    .map((tag) => [tag.name ?? '', tag.nameAr ?? ''])
    .sort((a, b) => (a[0] || a[1]).localeCompare(b[0] || b[1]))

  return writeWorkbook([
    { name: 'Bibliography', rows: [EXPORT_COLUMNS, ...rows] },
    { name: 'Keywords', rows: [['English', 'Arabic'], ...keywordRows] },
  ])
}
