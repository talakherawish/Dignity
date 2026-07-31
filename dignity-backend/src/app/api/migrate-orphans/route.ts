import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Move documents stranded in superseded collections into the ones the website
 * actually reads.
 * Visit http://localhost:3000/api/migrate-orphans in your browser to run this.
 *
 * Two collections outlived their replacements and stayed in the admin, so an
 * editor could publish into them and see nothing appear on the site:
 *
 *   publications  ->  publications-items   (the unified list the site reads)
 *   activities    ->  seminars / conferences / meetings / windsor-dignity
 *                     (split per type, keyed off the old `type` field)
 *
 * Copies rather than moves: the originals stay where they are, so if a mapping
 * here is wrong nothing has been destroyed and the document can be re-copied by
 * hand. Matching is on title, so re-running this creates no duplicates.
 */

/** The old `activities.type` value -> the collection that replaced it. */
const ACTIVITY_TARGET: Record<string, 'seminars' | 'conferences' | 'meetings' | 'windsor-dignity'> = {
  seminar: 'seminars',
  conference: 'conferences',
  meeting: 'meetings',
  'windsor-birzeit': 'windsor-dignity',
}

export async function GET() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const results: { from: string; to: string; title: string; status: string }[] = []

    // ── publications -> publications-items ────────────────────────────────
    const oldPublications = await payload.find({ collection: 'publications', limit: 200 })

    for (const doc of oldPublications.docs) {
      const d = doc as unknown as Record<string, unknown>
      const title = String(d.title ?? '')
      if (!title) continue

      const existing = await payload.find({
        collection: 'publications-items',
        where: { title: { equals: title } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        results.push({ from: 'publications', to: 'publications-items', title, status: 'already there' })
        continue
      }

      await payload.create({
        collection: 'publications-items',
        data: {
          type: d.type,
          title,
          titleAr: d.titleAr,
          author: d.author,
          authorAr: d.authorAr,
          date: d.date,
          description: d.description,
          descriptionAr: d.descriptionAr,
          file: d.file,
          image: d.image,
          link: d.link,
          _status: 'published' as const,
        } as never,
      })
      results.push({ from: 'publications', to: 'publications-items', title, status: 'copied' })
    }

    // ── activities -> the per-type collections ────────────────────────────
    const oldActivities = await payload.find({ collection: 'activities', limit: 200 })

    for (const doc of oldActivities.docs) {
      const d = doc as unknown as Record<string, unknown>
      const title = String(d.title ?? '')
      const target = ACTIVITY_TARGET[String(d.type ?? '')]

      if (!title) continue
      if (!target) {
        results.push({
          from: 'activities',
          to: '—',
          title,
          status: `skipped: unrecognised type "${String(d.type)}"`,
        })
        continue
      }

      const existing = await payload.find({
        collection: target,
        where: { title: { equals: title } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        results.push({ from: 'activities', to: target, title, status: 'already there' })
        continue
      }

      await payload.create({
        collection: target,
        data: {
          title,
          titleAr: d.titleAr,
          date: d.date,
          description: d.description,
          descriptionAr: d.descriptionAr,
          image: d.image,
          _status: 'published' as const,
        } as never,
      })
      results.push({ from: 'activities', to: target, title, status: 'copied' })
    }

    return Response.json({ ok: true, results })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
