/**
 * The command-line way in to src/lib/bibliographyImport.ts (which describes
 * the sheet it reads). The admin's Spreadsheet Imports does the same thing
 * without a terminal; this exists for test data and for creating a database
 * by name as part of the import. Entries are saved as drafts unless --publish.
 *
 * --target is required, so production is never written to by accident:
 *   sandbox     the same Atlas cluster, but a separate "dignity-sandbox"
 *               database the live site never reads -- for test data.
 *   production  the live database.
 *
 *   npm run payload -- run scripts/import-bibliography.ts --  *     --file "list.xlsx" --database "Annotated Bibliography on Dignity"  *     --database-ar "..." --target sandbox [--publish] [--dry-run]
 */
import { readFileSync } from 'fs'
import { formatReport, importBibliography } from '../src/lib/bibliographyImport'

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

async function databaseId(): Promise<string> {
  const { docs } = await payload.find({
    collection: 'databases',
    where: { title: { equals: databaseTitle } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) return String(docs[0].id)
  if (dryRun) return 'new-database'
  const created = await payload.create({
    collection: 'databases',
    data: { title: databaseTitle!, titleAr: databaseTitleAr ?? databaseTitle! },
  })
  console.log(`Created database "${databaseTitle}".`)
  return String(created.id)
}

const report = await importBibliography({
  payload,
  file: readFileSync(file),
  database: await databaseId(),
  publish,
  dryRun,
})
console.log(`\n${formatReport(report, dryRun)}`)
process.exit(0)
