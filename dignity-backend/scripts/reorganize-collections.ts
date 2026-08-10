/**
 * Move existing content into the collections that replaced it when the admin
 * was rearranged to mirror the website's navigation.
 *
 *   npm run payload -- run scripts/reorganize-collections.ts
 *
 *   publications-items  ->  books / papers / reports / brochures / theses /
 *                           audiovisual / posters   (keyed off the old `type`)
 *   pages/about         ->  about-initiative
 *   pages/partners      ->  partners
 *
 * Documents are copied at the database level rather than through payload.create
 * so that they keep their ids: Research links to its outputs by id, and every
 * one of those links would otherwise have to be re-picked by hand. The old
 * `type` field is dropped on the way — the collection a document now lives in
 * is what says what it is.
 *
 * Copies rather than moves. The originals stay in `publications-items` and
 * `pages`, which are no longer part of the Payload config and so no longer
 * appear in the admin, but are still there in the database if anything needs
 * checking against them. Re-running skips whatever already arrived, so it is
 * safe to run twice.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const PUBLICATION_TYPES = [
  'books',
  'papers',
  'reports',
  'brochures',
  'theses',
  'audiovisual',
  'posters',
] as const

type PublicationType = (typeof PUBLICATION_TYPES)[number]

const isPublicationType = (value: unknown): value is PublicationType =>
  PUBLICATION_TYPES.includes(value as PublicationType)

const payload = await getPayload({ config })
const db = payload.db.connection.db!

/** Mongoose pluralises some collection names (research -> researches). */
const collectionName = (slug: string) => payload.db.collections[slug]!.collection.name
const versionsName = (slug: string) =>
  payload.db.versions[slug]?.collection.name ?? `_${slug}_versions`

const log: string[] = []

// ── publications-items -> the seven typed collections ───────────────────────

const sourceItems = await db.collection('publications-items').find({}).toArray()
/** doc id -> the collection it went to, so its versions can follow it. */
const movedTo = new Map<string, PublicationType>()
let copied = 0
let skipped = 0

for (const doc of sourceItems) {
  const { type, ...rest } = doc
  if (!isPublicationType(type)) {
    log.push(`skipped "${String(doc.title)}" — unrecognised type ${JSON.stringify(type)}`)
    skipped++
    continue
  }

  movedTo.set(String(doc._id), type)
  const target = db.collection(collectionName(type))

  if ((await target.countDocuments({ _id: doc._id })) > 0) {
    skipped++
    continue
  }

  await target.insertOne(rest)
  copied++
}

log.push(`publications-items: ${copied} copied, ${skipped} already there or skipped`)

// Draft history, so an item's previous versions stay with the item.
const sourceVersions = await db.collection('_publications-items_versions').find({}).toArray()
let versionsCopied = 0
let versionsSkipped = 0

for (const doc of sourceVersions) {
  const version = doc.version as Record<string, unknown> | undefined
  const type = movedTo.get(String(doc.parent)) ?? version?.type
  if (!isPublicationType(type)) {
    versionsSkipped++
    continue
  }

  const target = db.collection(versionsName(type))
  if ((await target.countDocuments({ _id: doc._id })) > 0) {
    versionsSkipped++
    continue
  }

  if (version) delete version.type
  await target.insertOne(doc)
  versionsCopied++
}

log.push(
  `publications-items versions: ${versionsCopied} copied, ${versionsSkipped} already there or skipped`,
)

// ── pages -> the two standalone About pages ─────────────────────────────────

const PAGE_TARGETS: { pageSlug: string; collection: string }[] = [
  { pageSlug: 'about', collection: 'about-initiative' },
  { pageSlug: 'partners', collection: 'partners' },
]

for (const { pageSlug, collection } of PAGE_TARGETS) {
  const doc = await db.collection('pages').findOne({ slug: pageSlug })
  if (!doc) {
    log.push(`pages/${pageSlug}: not found — nothing to copy`)
    continue
  }

  const target = db.collection(collectionName(collection))
  if ((await target.countDocuments({})) > 0) {
    log.push(`${collection}: already has an entry — left untouched`)
    continue
  }

  const { slug: _pageSlug, ...rest } = doc
  await target.insertOne(rest)
  log.push(`pages/${pageSlug} -> ${collection}: copied "${String(doc.title)}"`)
}

// ── what the admin will show ────────────────────────────────────────────────

log.push('')
for (const slug of [
  ...PUBLICATION_TYPES,
  'about-initiative',
  'partners',
  'readings-documents',
  'databases',
]) {
  const count = await db.collection(collectionName(slug)).countDocuments()
  log.push(`${slug.padEnd(20)} ${String(count).padStart(4)}`)
}

console.log(log.join('\n'))

process.exit(0)
