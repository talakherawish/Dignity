import { getPayload } from 'payload'
import config from '@payload-config'
import { PAGE_SEEDS } from '@/lib/pagesContent'

/**
 * Seed / repair the editable About page.
 * Visit http://localhost:3000/api/seed-pages in your browser to run this.
 *
 * Upsert behaviour: creates a page if its slug is missing, otherwise updates
 * the existing doc so its title/description/body are brought back in line with
 * the canonical content in @/lib/pagesContent (which mirrors the frontend
 * fallback 1:1). Safe to run repeatedly. This also repairs older docs whose
 * `body` was stored as a plain string instead of rich text.
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

      // Section pages carry no prose body — omit the field entirely rather than
      // writing `undefined` over whatever an editor may have already added.
      const data = {
        slug: page.slug,
        title: page.title,
        titleAr: page.titleAr,
        description: page.description,
        descriptionAr: page.descriptionAr,
        ...(page.body ? { body: page.body, bodyAr: page.bodyAr } : {}),
        publishedAt: new Date(),
        _status: 'published' as const,
      }

      if (existing.docs.length === 0) {
        await payload.create({ collection: 'pages', data })
        results.push({ slug: page.slug, status: 'created' })
      } else {
        await payload.update({ collection: 'pages', id: existing.docs[0].id, data })
        results.push({ slug: page.slug, status: 'updated' })
      }
    }

    return Response.json({ success: true, message: 'Pages seed complete', results })
  } catch (error) {
    console.error('Seed failed:', error)
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
