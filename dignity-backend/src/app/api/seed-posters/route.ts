import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Turn the ten hardcoded posters into editable Publications documents.
 * Visit http://localhost:3000/api/seed-posters in your browser to run this.
 *
 * The posters were an array inside the website (src/data/publicationsFallback.ts)
 * serving static PDFs from /public/publications/posters. They rendered fine,
 * but nobody could add, retitle or remove one without a developer, and the same
 * PDFs had also been uploaded through the admin and were sitting in Media
 * unused — two copies of the same ten files, one of them uneditable.
 *
 * This pairs each poster with its uploaded copy and creates a real document, so
 * the page is driven by the CMS like every other publications page and the
 * static duplicates under /public can eventually go.
 *
 * Matching is on title, so re-running this creates no duplicates and never
 * overwrites an edit made in the admin.
 */

/** Display titles, paired with the Arabic filename the PDF was uploaded under. */
const POSTERS = [
  { title: 'Duration of the Employment Contract', titleAr: 'مدة عقد العمل', file: 'مدة عقد العمل' },
  { title: 'Domestic Work', titleAr: 'عمل المنازل', file: 'عمل المنازل' },
  { title: 'Special Employment Contract', titleAr: 'عقد عمل خاص', file: 'عقد عمل خاص' },
  { title: 'Persons with Disabilities', titleAr: 'ذوي الإعاقة', file: 'ذوي الاعاقة' },
  { title: 'Kindergarten Workers', titleAr: 'العاملات في رياض الأطفال', file: 'العاملات في رياض الاطفال' },
  { title: 'Social Security', titleAr: 'الضمان الاجتماعي', file: 'الضمان الاجتماعي' },
  { title: 'Annual Increases', titleAr: 'الزيادات السنوية', file: 'الزيادات السنوية' },
  { title: 'Minimum Wage', titleAr: 'الحد الأدنى للأجور', file: 'الحد الادنى للاجور' },
  { title: 'The Right to Strike', titleAr: 'الإضراب', file: 'الاضراب' },
  { title: 'Safety Procedures', titleAr: 'إجراءات السلامة', file: 'اجرائات السلامة' },
]

const AUTHOR = 'Dignity Initiative'
const AUTHOR_AR = 'مبادرة كرامة'
/** Originally published Dec 2021 with the Rosa Luxemburg Foundation. */
const PUBLISHED = '2021-12-01T00:00:00.000Z'

/** Same visible text always compares equal, whatever form it was typed in. */
const nfc = (value: string) => value.normalize('NFC')

export async function GET() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const results: { title: string; status: string; file?: string }[] = []
    const allMedia = (await payload.find({ collection: 'media', limit: 500 })).docs

    for (const poster of POSTERS) {
      const existing = await payload.find({
        collection: 'publications-items',
        where: { title: { equals: poster.title } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        results.push({ title: poster.title, status: 'already there — left untouched' })
        continue
      }

      // Matching happens here rather than through a `like` query because the
      // uploaded Arabic filenames are not in the same Unicode normal form as
      // the strings above: "اجرائات" arrives as yeh + combining hamza
      // (064A 0654) where a keyboard produces the single precomposed character
      // (0626). They render identically and compare unequal, and the database
      // does no normalising, so the query silently matched nothing.
      const pdfs = allMedia.filter((m) => {
        const filename = String((m as { filename?: string }).filename ?? '')
        if (!/\.pdf$/i.test(filename)) return false
        // Drop the extension and any -1 / -2 suffix left by a re-upload.
        const base = filename.replace(/(-\d+)?\.pdf$/i, '')
        return nfc(base) === nfc(poster.file)
      })
      // Several posters were uploaded more than once, leaving -1 / -2 copies.
      // Prefer whichever copy has a generated preview so the card isn't blank.
      const chosen =
        pdfs.find((m) => (m as { thumbnail?: unknown }).thumbnail) ?? pdfs[0]

      if (!chosen) {
        results.push({ title: poster.title, status: `no uploaded PDF matching "${poster.file}"` })
        continue
      }

      await payload.create({
        collection: 'publications-items',
        data: {
          type: 'posters',
          title: poster.title,
          titleAr: poster.titleAr,
          author: AUTHOR,
          authorAr: AUTHOR_AR,
          date: PUBLISHED,
          file: chosen.id,
          _status: 'published' as const,
        } as never,
      })
      results.push({
        title: poster.title,
        status: 'created',
        file: String((chosen as { filename?: string }).filename),
      })
    }

    return Response.json({ ok: true, results })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
