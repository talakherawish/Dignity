/**
 * Merge Seminars, Conferences, and Meetings into the new Forums collection,
 * now that Activities -> Forums is one page on the website rather than three.
 *
 *   npm run payload -- run scripts/merge-seminars-conferences-meetings-into-forums.ts
 *
 * Same approach as merge-announcements-into-news.ts: documents are copied at
 * the database level rather than through payload.create, so they keep their
 * ids -- anything that already links to one by id keeps resolving. Seminars
 * and Conferences carried no forumType (their collection *was* the type), so
 * it's stamped on here while copying; Meetings already had one (set on the
 * one existing round table -- see tag-forum-meetings.ts), so it's carried
 * over as-is, blank on the rest.
 *
 * Copies rather than moves. The three old collections are no longer part of
 * the Payload config, so they no longer appear in the admin, but their raw
 * data is still sitting in MongoDB under their old names if anything needs
 * checking against it.
 *
 * Re-running skips whatever already arrived, so it is safe to run twice.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const db = payload.db.connection.db!

const forumsName = payload.db.collections['forums']!.collection.name
const forumsVersionsName = payload.db.versions['forums']?.collection.name ?? '_forums_versions'

const log: string[] = []

type Stamp = 'seminar' | 'conference' | undefined

async function copyCollection(sourceName: string, stamp: Stamp) {
  const target = db.collection(forumsName)
  const sourceDocs = await db.collection(sourceName).find({}).toArray()
  let copied = 0
  let skipped = 0

  for (const doc of sourceDocs) {
    if ((await target.countDocuments({ _id: doc._id })) > 0) {
      skipped++
      continue
    }
    await target.insertOne(stamp ? { ...doc, forumType: doc.forumType ?? stamp } : doc)
    copied++
  }

  log.push(`${sourceName}: ${copied} copied, ${skipped} already there or skipped`)
}

async function copyVersions(sourceVersionsName: string, stamp: Stamp) {
  const targetVersions = db.collection(forumsVersionsName)
  const sourceVersions = await db.collection(sourceVersionsName).find({}).toArray()
  let copied = 0
  let skipped = 0

  for (const doc of sourceVersions) {
    if ((await targetVersions.countDocuments({ _id: doc._id })) > 0) {
      skipped++
      continue
    }
    const version = stamp ? { ...doc.version, forumType: doc.version?.forumType ?? stamp } : doc.version
    await targetVersions.insertOne({ ...doc, version })
    copied++
  }

  log.push(`${sourceVersionsName}: ${copied} copied, ${skipped} already there or skipped`)
}

// ── seminars -> forums (stamped forumType: 'seminar') ───────────────────────
await copyCollection('seminars', 'seminar')
await copyVersions('_seminars_versions', 'seminar')

// ── conferences -> forums (stamped forumType: 'conference') ────────────────
await copyCollection('conferences', 'conference')
await copyVersions('_conferences_versions', 'conference')

// ── meetings -> forums (forumType carried over as-is) ───────────────────────
await copyCollection('meetings', undefined)
await copyVersions('_meetings_versions', undefined)

// ── what the admin will show ────────────────────────────────────────────────

log.push('')
const count = await db.collection(forumsName).countDocuments()
log.push(`forums ${String(count).padStart(4)} (seminars, conferences, and meetings now included)`)

console.log(log.join('\n'))

process.exit(0)
