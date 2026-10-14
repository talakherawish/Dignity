/**
 * Turns a spreadsheet of readings into Readings in one Readings and Documents
 * subject (src/collections/Readings.ts), tagged with Keywords. What it creates
 * are ordinary readings -- editable, publishable and deletable in the admin;
 * nothing ties them to the sheet afterwards.
 *
 * Run from the admin by Spreadsheet Imports (src/collections/SpreadsheetImports.ts).
 *
 * The sheet needs a Title column; everything else is optional:
 *   Type, Lang, Names (authors, |-separated), Source, Year, URL, Keywords
 *   (|-separated), Note, Note_ar, Other_title and Other_URL (the same source in the
 *   other language), Internal note.
 * A bibliography export works too -- the team's Zotero sheets: where it was
 * published is read from Journal_name, Website_name, Book_title or Publisher,
 * the link from Page_url, and "source/access note" and "format" go into the
 * internal note. So does the optional "Keywords" sheet pairing English and
 * Arabic keywords, as in a bibliography import.
 *
 * Duplicates, similar titles and similar keywords are handled as in the
 * bibliography import (src/lib/importShared.ts).
 *
 * exportReadings (at the end) goes the other way: a subject's readings written
 * out as the same sheet.
 */
import type { Payload } from 'payload'
import {
  duplicateChecker,
  emptyReport,
  firstOf,
  isArabic,
  key,
  keywordResolver,
  retried,
  split,
  tidy,
  type ImportReport,
} from './importShared'
import { readWorkbook, writeWorkbook } from './xlsx'

const TYPES: Record<string, string> = {
  book: 'book',
  'book chapter': 'bookChapter',
  chapter: 'bookChapter',
  article: 'article',
  'journal article': 'article',
  'other article': 'article',
  report: 'report',
  document: 'document',
  declaration: 'document',
  code: 'document',
  law: 'document',
  charter: 'document',
  thesis: 'thesis',
  video: 'video',
  audio: 'video',
  'video or audio': 'video',
  website: 'website',
  'from website': 'website',
}

export async function importReadings({
  payload,
  file,
  subject,
  publish = false,
  dryRun = false,
}: {
  payload: Payload
  file: Buffer
  /** The id of the Readings and Documents subject the readings go into. */
  subject: string
  /** Publish the readings straight away rather than saving them as drafts. */
  publish?: boolean
  /** Read everything and report, but write nothing. */
  dryRun?: boolean
}): Promise<ImportReport> {
  const sheets = readWorkbook(file)
  const sheet = [...sheets.entries()].find(
    ([name, rows]) => name !== 'Keywords' && rows[0] && 'Title' in rows[0],
  )?.[1]
  if (!sheet) throw new Error('No sheet has a "Title" column in its first row.')

  const keywords = await keywordResolver(payload, sheets, dryRun)
  const report = emptyReport()
  const duplicates = duplicateChecker(
    (
      await payload.find({
        collection: 'readings',
        where: { subject: { equals: subject } },
        draft: true,
        pagination: false,
        depth: 0,
        select: { title: true, year: true },
      })
    ).docs,
    'subject',
  )

  for (const [index, row] of sheet.entries()) {
    // The sheet's own row number: its first row holds the column names.
    const rowNumber = index + 2
    const ownTitle = tidy(row.Title)
    const title = ownTitle || tidy(row.Book_title)
    if (!title) {
      report.skipped.push(`Row ${rowNumber}, no title: ${tidy(row.Names) || '(empty row)'}`)
      continue
    }
    const year = tidy(row.Year)

    try {
      if (duplicates.isDuplicate(report, rowNumber, title, year)) continue

      const lang = key(row.Lang)
      const language = lang.startsWith('ar')
        ? 'ar'
        : lang.startsWith('en')
          ? 'en'
          : lang
            ? 'other'
            : isArabic(title)
              ? 'ar'
              : 'en'
      const internalNote = [
        tidy(row['Internal note']),
        tidy(row['source/access note']),
        tidy(row.format) && `Format: ${tidy(row.format)}`,
      ]
        .filter(Boolean)
        .join('\n')
      const otherTitle = firstOf(row, 'Other_title', 'Title_ar')
      const otherLink = firstOf(row, 'Other_URL', 'URL_ar')
      const keywordIds = await keywords.keywordIdsFor(row.Keywords)

      const data = {
        subject,
        itemType: TYPES[key(row.Type ?? '')] ?? (row.Type ? 'other' : 'article'),
        language,
        title,
        authors: split(row.Names || row.Authors).map((name) => ({ name })),
        // A chapter's book, an article's journal or website, or the publisher.
        source:
          firstOf(row, 'Source', 'Journal_name', 'Website_name') ||
          (ownTitle ? tidy(row.Book_title) : '') ||
          tidy(row.Publisher) ||
          undefined,
        year: year || undefined,
        link: firstOf(row, 'URL', 'Link', 'Page_url') || undefined,
        note: (row.Note ?? row.Notes ?? '').trim() || undefined,
        noteAr: (row.Note_ar ?? '').trim() || undefined,
        otherVersion:
          otherTitle || otherLink
            ? { title: otherTitle || undefined, link: otherLink || undefined }
            : undefined,
        keywords: dryRun ? [] : keywordIds,
        internalNote: internalNote || undefined,
        _status: publish ? 'published' : 'draft',
      }

      if (!dryRun) {
        await retried(() =>
          payload.create({ collection: 'readings', data: data as never, draft: !publish }),
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

const EXPORT_COLUMNS = [
  'Type',
  'Lang',
  'Title',
  'Names',
  'Source',
  'Year',
  'URL',
  'Keywords',
  'Note',
  'Note_ar',
  'Other_title',
  'Other_URL',
  'File',
  'Other_file',
  'Internal note',
]

const TYPE_NAMES: Record<string, string> = {
  book: 'Book',
  bookChapter: 'Book chapter',
  article: 'Article',
  report: 'Report',
  document: 'Document',
  thesis: 'Thesis',
  video: 'Video',
  website: 'Website',
  other: 'Other',
}

type Media = { url?: string | null } | string | number | null | undefined
type Keyword = { id: string | number; name?: string | null; nameAr?: string | null }
type ExportedReading = {
  itemType?: string | null
  language?: string | null
  title?: string | null
  authors?: { name?: string | null }[] | null
  source?: string | null
  year?: string | null
  link?: string | null
  note?: string | null
  noteAr?: string | null
  file?: Media
  otherVersion?: { title?: string | null; link?: string | null; file?: Media } | null
  keywords?: (Keyword | string | number)[] | null
  internalNote?: string | null
}

const fileUrl = (media: Media) => (typeof media === 'object' && media ? (media.url ?? '') : '')

/**
 * Every reading in a subject -- drafts included -- as an .xlsx in the
 * import's own format, plus a "Keywords" sheet pairing each keyword used with
 * its translation. Hosted files are listed by their address; they aren't
 * re-imported from it.
 */
export async function exportReadings(payload: Payload, subject: string): Promise<Buffer> {
  const { docs } = await payload.find({
    collection: 'readings',
    where: { subject: { equals: subject } },
    draft: true,
    pagination: false,
    depth: 1,
    sort: 'title',
  })

  const keywords = new Map<string, Keyword>()
  const rows = (docs as ExportedReading[]).map((reading) => {
    const tags = (reading.keywords ?? []).filter(
      (k): k is Keyword => typeof k === 'object' && k !== null,
    )
    for (const tag of tags) keywords.set(String(tag.id), tag)
    const row: Record<string, string> = {
      Type: TYPE_NAMES[reading.itemType ?? ''] ?? 'Other',
      Lang: reading.language ?? 'en',
      Title: reading.title ?? '',
      Names: (reading.authors ?? [])
        .map((a) => a.name ?? '')
        .filter(Boolean)
        .join('|'),
      Source: reading.source ?? '',
      Year: reading.year ?? '',
      URL: reading.link ?? '',
      Keywords: tags
        .map((tag) => tag.name || tag.nameAr || '')
        .filter(Boolean)
        .join('|'),
      Note: reading.note ?? '',
      Note_ar: reading.noteAr ?? '',
      Other_title: reading.otherVersion?.title ?? '',
      Other_URL: reading.otherVersion?.link ?? '',
      File: fileUrl(reading.file),
      Other_file: fileUrl(reading.otherVersion?.file),
      'Internal note': reading.internalNote ?? '',
    }
    return EXPORT_COLUMNS.map((column) => row[column])
  })

  const keywordRows = [...keywords.values()]
    .map((tag) => [tag.name ?? '', tag.nameAr ?? ''])
    .sort((a, b) => (a[0] || a[1]).localeCompare(b[0] || b[1]))

  return writeWorkbook([
    { name: 'Readings', rows: [EXPORT_COLUMNS, ...rows] },
    { name: 'Keywords', rows: [['English', 'Arabic'], ...keywordRows] },
  ])
}
