import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Seed the research areas that used to be hardcoded in the website.
 * Visit http://localhost:3000/api/seed-research in your browser to run this.
 *
 * These six areas are named nodes in the approved sitemap (Activities →
 * Research), but they only ever existed as an array inside the frontend, so
 * nobody could edit them. They are created here as ordinary documents — from
 * this point they are added, edited and removed in the admin like anything
 * else, and this route is only a one-time migration.
 *
 * Upsert behaviour: matches on slug, creates when missing, and otherwise
 * leaves the existing document alone so a later edit in the admin is never
 * overwritten by re-running this. Also backfills a slug onto any research
 * document saved before the slug field existed.
 */

const RESEARCH_SEEDS = [
  { slug: 'dignity-issues', title: 'Dignity Issues', titleAr: 'قضايا الكرامة الإنسانية' },
  { slug: 'dignity-of-children', title: 'Dignity of Children', titleAr: 'كرامة الأطفال' },
  { slug: 'research-ethics', title: 'Research Ethics', titleAr: 'أخلاق البحث العلمي' },
  { slug: 'arab-dignity-revolutions', title: 'Arab Dignity Revolutions', titleAr: 'ثورات الكرامة العربية' },
  {
    slug: 'decolonising-knowledge-production',
    title: 'Decolonising Knowledge Production',
    titleAr: 'نزع الاستعمار من عملية إنتاج المعرفة',
  },
  { slug: 'artificial-intelligence', title: 'Artificial Intelligence', titleAr: 'الذكاء الاصطناعي' },
]

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const results: { slug: string; status: string }[] = []

    for (const seed of RESEARCH_SEEDS) {
      const existing = await payload.find({
        collection: 'research',
        where: { slug: { equals: seed.slug } },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'research',
          data: {
            slug: seed.slug,
            title: seed.title,
            titleAr: seed.titleAr,
            _status: 'published' as const,
          },
        })
        results.push({ slug: seed.slug, status: 'created' })
      } else {
        results.push({ slug: seed.slug, status: 'already present — left untouched' })
      }
    }

    // Documents created before the slug field existed have no address, so the
    // website can't link to them. Derive one from the title, once.
    const unslugged = await payload.find({ collection: 'research', limit: 200 })
    for (const doc of unslugged.docs) {
      const d = doc as { id: string; slug?: string; title?: string }
      if (!d.slug && d.title) {
        await payload.update({
          collection: 'research',
          id: d.id,
          data: { slug: toSlug(d.title) },
        })
        results.push({ slug: toSlug(d.title), status: 'slug backfilled' })
      }
    }

    return Response.json({ ok: true, results })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
