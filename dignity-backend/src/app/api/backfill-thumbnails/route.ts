import { getPayload } from 'payload'
import config from '@payload-config'

import { generateThumbnailForPdf, MAX_SOURCE_BYTES } from '@/lib/pdfThumbnail'

// This whole file is a one-time maintenance tool, not a regular part of the
// site. It exists to backfill thumbnails for PDF Media documents that were
// uploaded before generatePdfThumbnail (src/lib/pdfThumbnail.ts) worked
// correctly — the afterChange hook only ever runs for *newly created*
// documents, so it can never retroactively fix documents that already
// exist. This route walks every PDF in the Media collection that's still
// missing a thumbnail, generates one via the same logic the live hook uses,
// and attaches it — safe to run more than once, since it always re-checks
// which documents still need one and skips anything that already has a
// thumbnail. Once the existing backlog is cleared, this route has no more
// work to do and can be left in place or deleted; it's inert either way.
//
// Protected by a shared-secret query param rather than requiring a logged-in
// admin session, since this needs to be triggerable with a single browser
// visit to a URL (no login flow to script around) but must not be a public,
// unauthenticated door that lets anyone trigger repeated GitHub API writes
// and payload.create() calls. Set BACKFILL_SECRET in Vercel's environment
// variables to any random string, then visit:
//   https://<your-backend>/api/backfill-thumbnails?secret=<that-value>
export const maxDuration = 300

export async function GET(request: Request) {
  const url = new URL(request.url)
  const providedSecret = url.searchParams.get('secret')
  const expectedSecret = process.env.BACKFILL_SECRET

  if (!expectedSecret) {
    return Response.json(
      { error: 'BACKFILL_SECRET is not set in this environment — refusing to run an unprotected data-writing route.' },
      { status: 500 },
    )
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return Response.json({ error: 'Missing or incorrect secret.' }, { status: 401 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const candidates = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 200,
    where: {
      and: [
        { mimeType: { equals: 'application/pdf' } },
        { thumbnail: { exists: false } },
      ],
    },
  })

  const results: Array<{
    id: string | number
    filename: string
    status: 'ok' | 'skipped-too-large' | 'skipped-no-url' | 'failed'
    detail?: string
    thumbnailId?: string | number
  }> = []

  for (const doc of candidates.docs) {
    const filename = doc.filename ?? String(doc.id)
    const filesize = typeof doc.filesize === 'number' ? doc.filesize : 0

    if (filesize > MAX_SOURCE_BYTES) {
      results.push({
        id: doc.id,
        filename,
        status: 'skipped-too-large',
        detail: `${Math.round(filesize / 1024 / 1024)}MB exceeds the ${MAX_SOURCE_BYTES / 1024 / 1024}MB cap`,
      })
      continue
    }

    if (!doc.url) {
      results.push({ id: doc.id, filename, status: 'skipped-no-url' })
      continue
    }

    try {
      // doc.url is Payload's own /api/media/file/:filename path (this is
      // normal — see githubStorageAdapter.ts's staticHandler doc comment).
      // Fetch through this same server rather than reconstructing the raw
      // GitHub URL by hand, so this route automatically uses whatever
      // redirect/serving logic is actually live — if that logic is broken,
      // this backfill will surface the same failure clearly here instead of
      // silently using a different code path than real visitors do.
      const absoluteUrl = doc.url.startsWith('http') ? doc.url : `${url.origin}${doc.url}`
      const sourceResponse = await fetch(absoluteUrl, { redirect: 'follow' })

      if (!sourceResponse.ok) {
        throw new Error(`Fetching source PDF returned ${sourceResponse.status}`)
      }

      const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer())

      const { thumbnailId } = await generateThumbnailForPdf(payload, {
        id: doc.id,
        filename,
        sourceBuffer,
      })

      results.push({ id: doc.id, filename, status: 'ok', thumbnailId })
    } catch (error) {
      results.push({
        id: doc.id,
        filename,
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return Response.json({
    totalCandidates: candidates.docs.length,
    results,
  })
}
