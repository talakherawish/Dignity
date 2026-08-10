/**
 * Print the admin sidebar exactly as Payload builds it, so the grouping and
 * ordering can be checked against the website's navigation without clicking
 * through the admin.
 *
 *   npm run payload -- run scripts/print-admin-nav.ts
 *
 * Uses Payload's own grouping utility (the one the Nav component calls) over
 * the real, sanitised config, with every entity readable — so this is the
 * sidebar a logged-in user sees, not an approximation of it.
 */
import { getPayload } from 'payload'
import { groupNavItems, EntityType } from '@payloadcms/ui/shared'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const sanitized = payload.config

// Payload's own bookkeeping collections (preferences, locked documents…) are
// flagged hidden and never reach the sidebar; the admin filters them out
// through visibleEntities, so drop them here for the same reason.
const collections = sanitized.collections.filter((c) => c.admin?.hidden !== true)
const globals = sanitized.globals.filter((g) => g.admin?.hidden !== true)

const permissions = {
  collections: Object.fromEntries(collections.map((c) => [c.slug, { read: true }])),
  globals: Object.fromEntries(globals.map((g) => [g.slug, { read: true }])),
}

const i18n = { t: (key: string) => key.replace('general:', '') } as never

const groups = groupNavItems(
  [
    ...collections.map((entity) => ({ type: EntityType.collection, entity })),
    ...globals.map((entity) => ({ type: EntityType.global, entity })),
  ] as never,
  permissions as never,
  i18n,
)

for (const group of groups) {
  console.log(`\n${group.label}`)
  for (const entity of group.entities) {
    console.log(`  - ${entity.label}   [${entity.type}: ${entity.slug}]`)
  }
}

process.exit(0)
