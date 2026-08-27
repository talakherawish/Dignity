/**
 * Seeds every output's new `researchLines` field from the research lines
 * that already list it, now that the two are kept in sync both ways -- see
 * src/hooks/syncResearchLinks.ts and the `related*` fields on Research.
 *
 *   npm run payload -- run scripts/migrate-research-outputs-to-mirrored-links.ts
 *
 * Does this by re-saving every already-published research line with its own
 * current data -- that alone is enough to trigger the sync hook and have it
 * reconcile each `related*` field onto the matching output's `researchLines`,
 * so the mirroring logic runs exactly once rather than being reimplemented
 * here. A research line that's still a draft is skipped, same as the hook
 * would skip it on a normal save -- an unpublished link has nothing to show
 * on the other side yet. Safe to run more than once.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const { docs: researchLines } = await payload.find({
  collection: 'research',
  where: { _status: { equals: 'published' } },
  depth: 0,
  limit: 0,
  overrideAccess: true,
})

let touched = 0
for (const line of researchLines) {
  await payload.update({
    collection: 'research',
    id: line.id,
    data: {},
    overrideAccess: true,
  })
  touched++
}

console.log(`Re-saved ${touched} published research line(s) to seed mirrored links.`)
process.exit(0)
