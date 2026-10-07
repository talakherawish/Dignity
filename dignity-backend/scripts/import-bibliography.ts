/**
 * Loads an annotated-bibliography spreadsheet into one database, as
 * Bibliography Entries tagged with Keywords (src/collections/Bibliography.ts).
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
 * before any is created. Entries are saved as drafts unless --publish is given.
 *
 * --target is required, so production is never written to by accident:
 *   sandbox     the same Atlas cluster, but a separate "dignity-sandbox"
 *               database the live site never reads -- for test data.
 *   production  the live database.
 *
 *   npm run payload -- run scripts/import-bibliography.ts -- \
 *     --file "list.xlsx" --database "Annotated Bibliography on Dignity" \
 *     --database-ar "..." --target sandbox [--publish] [--dry-run]
 */
import { readWorkbook, type Row } from './lib/xlsx'

const SANDBOX_DATABASE = 'dignity-sandbox'

function argument(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`)
  return at === -1 ? undefined : process.argv[at + 1]
}
const flag = (name: string) => process.argv.includes(`--${name}`)

const file = argument('file')
const databaseTitle = argument('database')
const databaseTitleAr = argument('database-ar')
const target = argument('target')
const publish = flag('publish')
const dryRun = flag('dry-run')

if (!file || !databaseTitle || (target !== 'sandbox' && target !== 'production')) {
  console.error(
    'Needs --file, --database and --target sandbox|production. See the top of this script.',
  )
  process.exit(1)
}

if (target === 'sandbox') {
  // Point the same cluster at a database of its own. The path segment of a
  // mongodb URL names the database; the live site's URL leaves it empty.
  const url = new URL(process.env.DATABASE_URL ?? '')
  url.pathname = `/${SANDBOX_DATABASE}`
  process.env.DATABASE_URL = url.toString()
}

// Imported only now, so the config reads the DATABASE_URL set above.
const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
console.log(
  `Writing to database "${payload.db.connection.name}" (${target})${dryRun ? ' -- dry run' : ''}`,
)
if (target === 'sandbox' && payload.db.connection.name !== SANDBOX_DATABASE) {
  console.error('The sandbox URL did not take effect -- stopping before touching anything.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Reading the sheet

const sheets = readWorkbook(file)
const entrySheet = [...sheets.values()].find(
  (rows) => rows[0] && 'Names' in rows[0] && 'Type' in rows[0],
)
if (!entrySheet)
  throw new Error('No sheet with the Zotero columns (Type, Names, Title, ...) was found.')

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

// ---------------------------------------------------------------------------
// Keywords: the pairs sheet first, then whatever the entries use.

type Pair = { name?: string; nameAr?: string }
const pairs: Pair[] = []
const pairByKey = new Map<string, Pair>()
for (const row of sheets.get('Keywords') ?? []) {
  const name = tidy(row.English)
  const nameAr = tidy(row.Arabic)
  const existing = (name && pairByKey.get(key(name))) || (nameAr && pairByKey.get(key(nameAr)))
  if (existing) continue // the sheet lists a few twice
  const pair = { name: name || undefined, nameAr: nameAr || undefined }
  pairs.push(pair)
  if (name) pairByKey.set(key(name), pair)
  if (nameAr) pairByKey.set(key(nameAr), pair)
}

const unpaired = new Set<string>()
const keywordIds = new Map<string, string>()

/** The id of the keyword spelled this way, creating it (and its pair) if new. */
async function keywordId(raw: string): Promise<string | undefined> {
  const text = tidy(raw)
  if (keywordIds.has(key(text))) return keywordIds.get(key(text))

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
    if (match) {
      id = String(match.id)
      // Fill in a missing translation on a keyword that already exists.
      const other = side === 'name' ? 'nameAr' : 'name'
      if (pair[other] && !match[other] && !dryRun) {
        await payload.update({
          collection: 'keywords',
          id: match.id,
          data: { [other]: pair[other] },
        })
      }
      break
    }
  }
  if (!id) {
    id = dryRun
      ? `new:${text}`
      : String(
          (
            await payload.create({
              collection: 'keywords',
              data: { name: pair.name, nameAr: pair.nameAr },
            })
          ).id,
        )
  }
  for (const side of sides) keywordIds.set(key(pair[side]!), id)
  return id
}

// ---------------------------------------------------------------------------
// The database the entries go into

async function databaseId(): Promise<string> {
  const { docs } = await payload.find({
    collection: 'databases',
    where: { title: { equals: databaseTitle } },
    draft: true,
    limit: 1,
    depth: 0,
  })
  if (docs[0]) return String(docs[0].id)
  if (dryRun) return 'new-database'
  const created = await payload.create({
    collection: 'databases',
    data: {
      title: databaseTitle!,
      titleAr: databaseTitleAr ?? databaseTitle!,
      _status: publish ? 'published' : 'draft',
    },
    draft: !publish,
  })
  console.log(`Created database "${databaseTitle}".`)
  return String(created.id)
}

// ---------------------------------------------------------------------------
// Entries

/**
 * A source with a URL is linked; anything else is a citation. "Upload" in the
 * readings list can't be honoured yet -- there's no file -- so it's noted for
 * the team instead, and the file can be attached in the admin.
 */
function access(row: Row): { access: string; note?: string } {
  const action = key(row['website actiom'] ?? row['website action'] ?? '')
  const linked = tidy(row.URL || row.Page_url) ? 'link' : 'citation'
  return action === 'upload'
    ? { access: linked, note: 'Marked for upload -- no file attached yet.' }
    : { access: linked }
}

const database = await databaseId()
const skipped: string[] = []
let created = 0

for (const row of entrySheet) {
  const ownTitle = tidy(row.Title)
  const bookTitle = tidy(row.Book_title)
  const title = ownTitle || bookTitle
  if (!title) {
    skipped.push(`(no title) ${tidy(row.Names)}`)
    continue
  }
  const year = tidy(row.Year)

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
    skipped.push(`(already imported) ${title}`)
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
    if (id && !keywords.includes(id)) keywords.push(id)
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
      (ownTitle ? bookTitle : '') || tidy(row.Journal_name) || tidy(row.Website_name) || undefined,
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
    await payload.create({
      collection: 'bibliography-entries',
      data: data as never,
      draft: !publish,
    })
  }
  created++
}

console.log(
  `\n${dryRun ? 'Would create' : 'Created'} ${created} entries; skipped ${skipped.length}.`,
)
for (const line of skipped) console.log(`  skipped: ${line}`)
console.log(`Keywords in use: ${new Set(keywordIds.values()).size}.`)
if (unpaired.size) {
  console.log(
    `\n${unpaired.size} keywords had no translation in the Keywords sheet -- created in one language only:`,
  )
  for (const word of [...unpaired].sort((a, b) => a.localeCompare(b))) console.log(`  ${word}`)
}
process.exit(0)
