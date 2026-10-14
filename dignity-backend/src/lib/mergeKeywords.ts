import type { Payload, TypedUser } from 'payload'

/**
 * Merges one keyword into another: every Bibliography Entry and Reading tagged
 * with `from` is tagged with `into` instead, `into` picks up whichever language
 * it was missing from `from`, and `from` is deleted. For the near-duplicates
 * the Keywords list flags ("Clientalism" into "Clientelism").
 *
 * Entries and readings have drafts, so a document can hold two sets of
 * keywords: its published version, and a newer draft not yet published. Both
 * are retagged, and a pending draft stays a pending draft -- re-saving the
 * published version alone would otherwise make it the latest version and
 * quietly drop the draft's unpublished edits.
 *
 * Runs write by write, outside a transaction, like the spreadsheet import: a
 * few hundred updates in one transaction is what Atlas times out.
 */

const TAGGED = ['bibliography-entries', 'readings-documents'] as const

type Ref = string | number | { id: string | number }
const idOf = (ref: Ref) => String(typeof ref === 'object' ? ref.id : ref)

function retag(keywords: Ref[] | null | undefined, from: string, into: string): string[] {
  const ids = (keywords ?? []).map(idOf).map((id) => (id === from ? into : id))
  return [...new Set(ids)]
}

const tagged = (keywords: Ref[] | null | undefined, from: string) =>
  (keywords ?? []).some((ref) => idOf(ref) === from)

export async function mergeKeywords({
  payload,
  from,
  into,
  user,
}: {
  payload: Payload
  from: string
  into: string
  user?: TypedUser | null
}): Promise<{ retagged: number }> {
  if (from === into) throw new Error('A keyword cannot be merged into itself.')
  const source = await payload.findByID({ collection: 'keywords', id: from, depth: 0 })
  const target = await payload.findByID({ collection: 'keywords', id: into, depth: 0 })

  let retagged = 0
  for (const collection of TAGGED) {
    // Documents tagged in their published/main version, or in their latest draft.
    const ids = new Set<string>()
    for (const draft of [false, true]) {
      const { docs } = await payload.find({
        collection,
        where: { keywords: { in: [from] } },
        draft,
        pagination: false,
        depth: 0,
        select: { title: true },
      })
      for (const doc of docs) ids.add(String(doc.id))
    }

    for (const id of ids) {
      const main = await payload.findByID({ collection, id, depth: 0, draft: false })
      const latest = await payload.findByID({ collection, id, depth: 0, draft: true })
      // A draft saved after the main document was last written -- whether the
      // document was ever published or not, Payload keeps such a draft only as
      // a version.
      const pendingDraft = String(latest.updatedAt) !== String(main.updatedAt)

      if (tagged(main.keywords as Ref[], from)) {
        await payload.update({
          collection,
          id,
          depth: 0,
          draft: false,
          user,
          data: { keywords: retag(main.keywords as Ref[], from, into) },
        })
      }
      if (pendingDraft) {
        // Saved again in full, so it stays the latest version with its edits.
        const {
          id: _id,
          createdAt: _c,
          updatedAt: _u,
          _status,
          ...fields
        } = latest as unknown as Record<string, unknown>
        await payload.update({
          collection,
          id,
          depth: 0,
          draft: true,
          user,
          data: { ...fields, keywords: retag(latest.keywords as Ref[], from, into) } as never,
        })
      }
      retagged++
    }
  }

  // Deleted before the translation moves over: the Keywords form refuses a
  // name another keyword already has, and until now `from` had it.
  await payload.delete({ collection: 'keywords', id: from, user })
  const missing = {
    ...(!target.name && source.name ? { name: source.name } : {}),
    ...(!target.nameAr && source.nameAr ? { nameAr: source.nameAr } : {}),
  }
  if (Object.keys(missing).length) {
    await payload.update({ collection: 'keywords', id: into, data: missing, user })
  }
  return { retagged }
}
