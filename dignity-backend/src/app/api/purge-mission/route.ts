import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Delete every trace of the removed Mission & Vision page from the database.
 * Visit http://localhost:3000/api/purge-mission in your browser to run this.
 *
 * Taking the page out of the config stopped it being served or edited, but left
 * its stored data behind in two places:
 *
 *   - the `mission` document in the retired `pages` collection, plus whatever
 *     draft versions it accumulated;
 *   - the `page-mission` global. Removing a global from the config also removes
 *     Payload's ability to address it, so this one can only be reached through
 *     the underlying Mongo connection.
 *
 * Deliberately narrow: it matches the `mission` slug and the `page-mission`
 * global name and nothing else, and reports exactly what it removed. Running it
 * a second time finds nothing left and reports zero.
 */

export async function GET() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const removed: { what: string; count: number }[] = []

  try {
    // ── the pages document (registered collection, so Payload can do it) ────
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'mission' } },
      limit: 10,
    })

    for (const doc of existing.docs) {
      await payload.delete({ collection: 'pages', id: (doc as { id: string }).id })
    }
    removed.push({ what: 'pages document "mission"', count: existing.docs.length })

    // ── everything Payload can no longer address ───────────────────────────
    const connection = (payload.db as unknown as { connection?: { db?: unknown } }).connection
    const mongo = connection?.db as
      | {
          collection: (name: string) => {
            deleteMany: (filter: Record<string, unknown>) => Promise<{ deletedCount?: number }>
          }
          listCollections: () => { toArray: () => Promise<{ name: string }[]> }
        }
      | undefined

    if (!mongo) {
      removed.push({ what: 'globals — no Mongo connection available, skipped', count: 0 })
    } else {
      const names = (await mongo.listCollections().toArray()).map((c) => c.name)

      // Payload keeps every global as a row in `globals`, keyed by slug.
      if (names.includes('globals')) {
        const r = await mongo.collection('globals').deleteMany({ globalType: 'page-mission' })
        removed.push({ what: 'page-mission global', count: r.deletedCount ?? 0 })
      }

      // Draft/version history for both of the above.
      for (const name of names.filter((n) => /versions/i.test(n))) {
        const r = await mongo.collection(name).deleteMany({
          $or: [{ globalType: 'page-mission' }, { 'version.slug': 'mission' }, { parent: null, globalType: 'page-mission' }],
        })
        if ((r.deletedCount ?? 0) > 0) {
          removed.push({ what: `${name} (version history)`, count: r.deletedCount ?? 0 })
        }
      }
    }

    return Response.json({ ok: true, removed })
  } catch (error) {
    return Response.json(
      { ok: false, removed, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
