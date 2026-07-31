import { getPayload } from 'payload'
import config from '@payload-config'
import { PAGE_SEEDS } from '@/lib/pagesContent'

/**
 * Update the existing About page so it is published and its
 * content matches the canonical copy in @/lib/pagesContent (mirrors the
 * frontend fallback 1:1). Unlike /api/seed-pages this only touches pages that
 * already exist — it never creates missing ones.
 * Visit http://localhost:3000/api/update-pages in your browser to run this.
 */
export async function GET() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const results: { slug: string; status: string }[] = []

    for (const page of PAGE_SEEDS) {
      const existing = await payload.find({
        collection: 'pages',
        where: { slug: { equals: page.slug } },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        results.push({ slug: page.slug, status: 'skipped (not found — run /api/seed-pages)' })
        continue
      }

      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data: {
          title: page.title,
          titleAr: page.titleAr,
          description: page.description,
          descriptionAr: page.descriptionAr,
          // Only the long-form pages define a body — never overwrite an
          // editor's prose with `undefined` on the section pages.
          ...(page.body ? { body: page.body, bodyAr: page.bodyAr } : {}),
          _status: 'published',
        },
      })
      results.push({ slug: page.slug, status: 'updated' })
    }

    return Response.json({ success: true, message: 'Pages updated', results })
  } catch (error) {
    console.error('Update failed:', error)
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
