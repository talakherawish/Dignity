/**
 * Move existing Announcements into News now that the two have been merged
 * into one "News & Announcements" collection.
 *
 *   npm run payload -- run scripts/merge-announcements-into-news.ts
 *
 * Documents are copied at the database level rather than through
 * payload.create so they keep their ids — anything that already links to an
 * announcement by id (a homepage card, a shared /media/announcements?id=…
 * URL) keeps resolving after the move. News carries an `excerpt` field
 * Announcements never had; it's simply left blank on the copied docs.
 *
 * Copies rather than moves. The originals stay in `announcements`, which is
 * no longer part of the Payload config and so no longer appears in the
 * admin, but the data is still there if anything needs checking against it.
 * Re-running skips whatever already arrived, so it is safe to run twice.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const db = payload.db.connection.db!

/** Mongoose pluralises some collection names. */
const collectionName = (slug: string) => payload.db.collections[slug]!.collection.name
const versionsName = (slug: string) => payload.db.versions[slug]?.collection.name ?? `_${slug}_versions`

const log: string[] = []

// ── announcements -> news ───────────────────────────────────────────────────

const target = db.collection(collectionName('news'))
const sourceDocs = await db.collection('announcements').find({}).toArray()
let copied = 0
let skipped = 0

for (const doc of sourceDocs) {
  if ((await target.countDocuments({ _id: doc._id })) > 0) {
    skipped++
    continue
  }
  await target.insertOne(doc)
  copied++
}

log.push(`announcements: ${copied} copied, ${skipped} already there or skipped`)

// Draft history, so an announcement's previous versions stay with it.
const targetVersions = db.collection(versionsName('news'))
const sourceVersions = await db.collection('_announcements_versions').find({}).toArray()
let versionsCopied = 0
let versionsSkipped = 0

for (const doc of sourceVersions) {
  if ((await targetVersions.countDocuments({ _id: doc._id })) > 0) {
    versionsSkipped++
    continue
  }
  await targetVersions.insertOne(doc)
  versionsCopied++
}

log.push(`announcements versions: ${versionsCopied} copied, ${versionsSkipped} already there or skipped`)

// ── what the admin will show ────────────────────────────────────────────────

log.push('')
const count = await target.countDocuments()
log.push(`news ${String(count).padStart(4)} (announcements now included)`)

console.log(log.join('\n'))

process.exit(0)
