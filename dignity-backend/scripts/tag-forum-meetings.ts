/**
 * One-time tagging pass for the new Forums section.
 *
 *   npm run payload -- run scripts/tag-forum-meetings.ts
 *
 * Seminars and Conferences don't need tagging -- every document in those
 * collections is already unambiguously that type, just by virtue of which
 * collection it lives in. Meetings is the one collection that mixes plain
 * meetings, discussions, and (so far) round tables, so it's the one that
 * needs a per-document forumType set: any meeting already marked
 * kind: 'roundtable' is exactly the kind of thing Forums -> Roundtable is
 * for, so it gets forumType: 'roundtable' here. Nothing else is touched --
 * plain meetings and discussions have no forum type and stay exactly where
 * they were, on the Meetings page.
 *
 * Idempotent: only touches documents where forumType isn't already set, so
 * running it again is a no-op.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'meetings',
  where: {
    kind: { equals: 'roundtable' },
    forumType: { exists: false },
  },
  limit: 0,
  depth: 0,
  draft: true,
  overrideAccess: true,
})

for (const doc of docs) {
  await payload.update({
    collection: 'meetings',
    id: doc.id,
    data: { forumType: 'roundtable' },
    overrideAccess: true,
  })
  console.log(`tagged forumType=roundtable: "${doc.title}" (${doc.id})`)
}

console.log(docs.length === 0 ? 'nothing to tag' : `${docs.length} meeting(s) tagged`)
process.exit(0)
