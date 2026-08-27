import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionSlug } from 'payload'

/**
 * Keeps a research line's `related*` field and the matching output's
 * `researchLines` field pointing at each other. An editor can attach the
 * link from either side -- open the research line and pick a paper, or open
 * the paper and pick a research line -- because underneath it's one
 * relationship mirrored onto both documents, not two independent lists that
 * can drift apart.
 *
 * Wired into every output collection (Books, Papers, ..., Forums) and into
 * Research itself -- see the `hooks.afterChange` / `hooks.afterDelete` on
 * each. Only ever acts on published documents: a link set on a draft that
 * has never gone live has nothing to show on the other side yet, so nothing
 * is mirrored until the doc is actually published.
 *
 * Loop prevention deliberately does NOT use Payload's `context` option.
 * `req.context` is a single mutable object Payload shares across every hook
 * in one request -- setting a flag on it from a nested `update()` call
 * leaves that flag set for every *sibling* hook still left to run in the
 * outer document's own `afterChange` list (there's one of these per output
 * type on Research), which then bails out before it ever runs: a brochure
 * link set on the same save as a paper link would silently vanish. A
 * module-level "who's currently being written by us" set does the same job
 * without touching shared state, and lets the nested calls keep sharing the
 * triggering save's `req` -- dropping `req` instead (to dodge the context
 * issue) opens a fresh transaction per linked document, which is what turned
 * a single big save (dozens of outputs) into enough sequential round trips
 * to outlive MongoDB's transaction timeout.
 */

const syncing = new Set<string>()

function markerKey(collection: string, id: string | number): string {
  return `${collection}:${id}`
}

function idsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item : (item as { id?: unknown })?.id))
    .filter((id): id is string => typeof id === 'string')
}

type LinkConfig = {
  /** The field on this collection holding the other side's ids. */
  field: string
  /** The collection those ids point to. */
  relationTo: CollectionSlug
  /** The field on `relationTo` that mirrors this one back. */
  mirrorField: string
}

/**
 * After a document is published, makes sure every doc it now links to (via
 * `field`) mirrors it back (via `mirrorField`), and every doc that used to
 * mirror it but no longer should gets unlinked. Diffs against who currently
 * mirrors this doc -- found with a query, not `previousDoc` -- so it stays
 * correct no matter how many unpublished draft edits happened in between.
 */
export function mirrorLinksOnChange({ field, relationTo, mirrorField }: LinkConfig): CollectionAfterChangeHook {
  return async ({ doc, req, collection }) => {
    if (syncing.has(markerKey(collection.slug, doc.id))) return doc
    if (doc._status !== 'published') return doc

    const wantIds = new Set(idsOf(doc[field]))

    const holders = await req.payload.find({
      collection: relationTo,
      where: { [mirrorField]: { in: [doc.id] } },
      depth: 0,
      limit: 0,
      overrideAccess: true,
      req,
    })
    const haveIds = new Set(holders.docs.map((d) => String(d.id)))

    const toLink = [...wantIds].filter((id) => !haveIds.has(id))
    const toUnlink = [...haveIds].filter((id) => !wantIds.has(id))

    for (const id of [...toLink, ...toUnlink]) {
      // `wantIds` can hold an id whose document no longer exists -- a
      // relationship field doesn't clean itself up when its target is
      // deleted (see the `relatedBrochures` note on Research.ts's own data).
      // Nothing to mirror onto, so skip it rather than let a 404 here abort
      // every other link this save was trying to make.
      let target: unknown
      try {
        target = await req.payload.findByID({
          collection: relationTo,
          id,
          depth: 0,
          overrideAccess: true,
          req,
        })
      } catch {
        continue
      }

      const existing = idsOf((target as Record<string, unknown>)[mirrorField])
      const next = toLink.includes(id)
        ? existing.includes(String(doc.id))
          ? existing
          : [...existing, String(doc.id)]
        : existing.filter((existingId) => existingId !== String(doc.id))

      const key = markerKey(relationTo, id)
      syncing.add(key)
      try {
        await req.payload.update({
          collection: relationTo,
          id,
          data: { [mirrorField]: next },
          overrideAccess: true,
          req,
        })
      } finally {
        syncing.delete(key)
      }
    }

    return doc
  }
}

/** Removes a deleted document's id from every doc that was mirroring it. */
export function mirrorLinksOnDelete({
  relationTo,
  mirrorField,
}: Omit<LinkConfig, 'field'>): CollectionAfterDeleteHook {
  return async ({ doc, req }) => {
    const holders = await req.payload.find({
      collection: relationTo,
      where: { [mirrorField]: { in: [doc.id] } },
      depth: 0,
      limit: 0,
      overrideAccess: true,
      req,
    })

    for (const holder of holders.docs) {
      const existing = idsOf((holder as unknown as Record<string, unknown>)[mirrorField])
      const key = markerKey(relationTo, holder.id)
      syncing.add(key)
      try {
        await req.payload.update({
          collection: relationTo,
          id: holder.id,
          data: { [mirrorField]: existing.filter((id) => id !== String(doc.id)) },
          overrideAccess: true,
          req,
        })
      } finally {
        syncing.delete(key)
      }
    }

    return doc
  }
}
