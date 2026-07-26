import { after } from 'next/server'
import sharp from 'sharp'
import type { BasePayload, CollectionAfterChangeHook } from 'payload'

// `pdf-to-img` is imported lazily (inside generateThumbnailForPdf) rather than
// at module top-level. This file is pulled in by Media.ts -> payload.config.ts,
// so a static top-level import runs the moment the whole Payload config loads —
// and pdf-to-img's pdfjs-dist dependency throws `ReferenceError: DOMMatrix is
// not defined` on Vercel's Node runtime (DOMMatrix is a browser/Canvas API, not
// available in Node by default). That crashed EVERY collection's API route
// (participants, articles, pages, etc.), not just Media/PDF ones, since it's a
// module-evaluation failure, not a runtime one. Deferring the import to the
// moment a PDF is actually processed means a pdf-to-img failure is caught by
// the existing try/catch in generatePdfThumbnail's after() block below (PDF
// just keeps its generic-icon placeholder) instead of taking down the whole
// backend. See [[project_clippings_preview_download_unresolved]]-adjacent
// incident from 2026-07-25: this exact crash caused a full Payload outage.

/**
 * Auto-generates a page-1 thumbnail for any PDF uploaded to the Media
 * collection, so cards on the site (Clippings, Publications) can show a real
 * preview image instead of a generic document icon.
 *
 * Why this exists: browsers cannot rasterize a PDF's contents from a plain
 * <img src="file.pdf"> tag — that silently fails. Editors previously had to
 * manually create and upload a separate "cover image" alongside every PDF
 * (as done for the first Brochures entry) to get a visual preview at all.
 * This hook removes that manual step for future uploads.
 *
 * How it works: runs as an `afterChange` hook on the Media collection. When
 * the incoming file is a PDF under MAX_SOURCE_BYTES, it captures the
 * already-uploaded file's bytes from `req.file.data`, then (deferred via
 * `after()`, see below) rasterizes page 1 to a PNG buffer using pdf-to-img
 * (a thin, pure-npm wrapper around pdfjs-dist's Node-canvas-free rendering
 * path — no native binary dependency, safe for Vercel's build), creates a
 * second Media document from that PNG via `payload.create`, and finally
 * `payload.update`s the *original* document's `thumbnail` field to point at
 * it.
 *
 * IMPORTANT — why this is `afterChange` + `next/server`'s `after()`, not
 * `beforeChange`:
 * This used to be a `beforeChange` hook that awaited rasterization + a
 * second `payload.create` (itself a GitHub Contents API upload) *before*
 * returning, which meant the entire original upload request stayed open
 * for both round-trips combined. On Vercel's default function duration
 * (10s on Hobby, per vercel.com/docs/functions/configuring-functions/duration),
 * a multi-MB PDF's rasterization + a second network upload routinely blew
 * past that ceiling — Vercel kills the function mid-request, so the
 * try/catch below never even gets a chance to run, no thumbnail is ever
 * created, and — worse — the *original* upload request could be killed
 * before its own document/file write finished, since it was all one
 * function invocation. That's why every recent PDF had zero `thumbnail`
 * and no error appeared anywhere in Vercel's logs.
 *
 * Firing this in `afterChange`, wrapped in Next's `after()`, means the
 * original document has already been saved and the response is already on
 * its way to the client; the thumbnail generation below runs as a
 * best-effort background task that updates the document afterward if it
 * succeeds. A bare `void (async () => {...})()` is NOT enough on Vercel —
 * once the response is sent, a serverless function can freeze/terminate
 * immediately, killing any detached promise mid-flight. `after()` is
 * Next.js's (15.1+) supported way to keep the function alive specifically
 * for this kind of post-response work — see
 * vercel.com/docs/functions/functions-api-reference/vercel-functions-package#waituntil,
 * which explicitly recommends `after()` over the older `waitUntil()` on
 * Next 15.1+. Note this doesn't grant unlimited extra time: per that same
 * page, deferred work shares the *same timeout as the function itself*, so
 * `maxDuration` on the route (see route.ts) still has to be raised for this
 * to reliably finish. A slow or failed thumbnail can now never delay or
 * crash the parent upload — worst case, the card just keeps showing the
 * generic file icon, exactly like before this hook existed.
 *
 * This only ever fires for `create` operations with an actual file attached
 * — editing metadata on an existing Media doc (e.g. fixing the alt text)
 * does not re-trigger thumbnail generation, and it never re-fires on the
 * thumbnail PNG documents this hook itself creates (guarded by mimetype).
 *
 * NOTE: this hook only ever runs for newly created documents going forward.
 * Documents uploaded before this hook existed (or before the afterChange
 * rework) never get their thumbnail backfilled automatically — see the
 * one-time backfill route at src/app/api/backfill-thumbnails/route.ts,
 * which calls generateThumbnailForPdf (exported below) directly against
 * every existing PDF Media doc that's still missing one.
 */

// Rasterizing a PDF page then re-uploading the result to GitHub is two
// expensive steps stacked on top of the original upload. Skip files above
// this size — those are exactly the ones most likely to time out, and are
// unusually large for a press clipping/brochure PDF in the first place.
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024 // 25MB

/**
 * Width (px) the page-1 render is downscaled to before being stored.
 *
 * pdf-to-img at `scale: 2` renders a poster-sized page at ~2834x3968, which
 * encodes to a ~7MB PNG — measured on this project's own clipping PDFs. That
 * is far too heavy to store and then load a dozen of into a card grid, and
 * base64-inflates to ~10MB when committed through the GitHub Contents API.
 * The cards display at roughly 300px wide, so 800px still leaves 2x headroom
 * for high-DPI screens while cutting the stored file ~24x (7.18MB -> ~299KB
 * on the measured sample).
 */
const THUMBNAIL_WIDTH = 800

/**
 * Core rasterize-and-attach logic, shared by the afterChange hook (for new
 * uploads) and the one-time backfill route (for pre-existing PDFs). Takes
 * the already-known file bytes directly rather than fetching them, since
 * the two callers obtain those bytes differently (req.file.data during a
 * live upload vs. a GitHub Contents API fetch during backfill) and this
 * function shouldn't need to know which.
 *
 * Throws on failure rather than swallowing errors — callers decide how to
 * handle/log a failure for their own context (the hook logs and moves on;
 * the backfill route reports per-file success/failure back to the caller).
 */
export async function generateThumbnailForPdf(
  payload: BasePayload,
  args: { id: string | number; filename: string; sourceBuffer: Buffer },
): Promise<{ thumbnailId: string | number }> {
  const { id, filename, sourceBuffer } = args

  const { pdf } = await import('pdf-to-img')

  const base64 = sourceBuffer.toString('base64')
  const dataUrl = `data:application/pdf;base64,${base64}`

  const document = await pdf(dataUrl, { scale: 2 })
  const firstPageBuffer = await document.getPage(1)

  if (!firstPageBuffer) {
    throw new Error('pdf-to-img returned no page-1 buffer (empty or corrupt PDF?)')
  }

  // Downscale before storing — see THUMBNAIL_WIDTH. `withoutEnlargement` keeps
  // pages that are already narrower than the target at their native size
  // instead of upscaling them into a blurry, needlessly larger file.
  // `palette: true` quantises to an indexed palette, which suits the flat
  // colour of scanned documents and infographic-style posters and roughly
  // halves the stored file again (measured 883KB -> 357KB on this project's
  // own clipping) with no visible loss at the size these are displayed.
  const thumbnailBuffer = await sharp(firstPageBuffer)
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .png({ palette: true, quality: 85, compressionLevel: 9 })
    .toBuffer()

  const originalName = filename.replace(/\.pdf$/i, '')
  const thumbnailFilename = `${originalName}-thumb.png`

  const thumbnailDoc = await payload.create({
    collection: 'media',
    data: {
      alt: `Preview of ${filename}`,
    },
    file: {
      data: thumbnailBuffer,
      mimetype: 'image/png',
      name: thumbnailFilename,
      size: thumbnailBuffer.length,
    },
  })

  await payload.update({
    collection: 'media',
    id,
    data: {
      thumbnail: thumbnailDoc.id,
    },
  })

  return { thumbnailId: thumbnailDoc.id }
}

export const generatePdfThumbnail: CollectionAfterChangeHook = async ({ doc, req, operation, previousDoc }) => {
  if (operation !== 'create') return doc
  if (doc.mimeType !== 'application/pdf') return doc
  // Guard against re-triggering on the thumbnail PNG this hook itself
  // creates via payload.update below (that write has no `mimeType` change
  // relevant here since PNGs never match the check above, but keeping this
  // explicit protects against future edits to this file).
  if (previousDoc?.thumbnail) return doc

  const filesize = typeof doc.filesize === 'number' ? doc.filesize : 0
  if (filesize > MAX_SOURCE_BYTES) {
    req.payload.logger.info(
      `Skipping PDF thumbnail for "${doc.filename}": ${Math.round(filesize / 1024 / 1024)}MB exceeds the ${MAX_SOURCE_BYTES / 1024 / 1024}MB cap.`,
    )
    return doc
  }

  // Capture the already-uploaded file's bytes now, synchronously, while
  // req.file is still guaranteed to be populated (this is the same request
  // that just uploaded it). This buffer is closed over by the after()
  // callback below so thumbnailing never depends on req.file surviving
  // until that deferred callback actually runs, nor on re-fetching the file
  // back over the network (which requires a correctly configured
  // `serverURL` — not currently set in payload.config.ts — and would add an
  // avoidable network round-trip on top of everything else).
  const sourceFileBuffer = req.file?.data
  const docId = doc.id
  const docFilename = doc.filename ?? 'file'

  // Scheduled via Next's after() so this keeps running past the point the
  // response is sent, instead of racing the function's teardown. Any
  // failure here is caught locally and logged; it can never surface as a
  // failed upload to the editor.
  after(async () => {
    try {
      if (!sourceFileBuffer) {
        throw new Error('req.file.data was not available when the afterChange hook ran — cannot generate thumbnail without it.')
      }
      await generateThumbnailForPdf(req.payload, {
        id: docId,
        filename: docFilename,
        sourceBuffer: sourceFileBuffer,
      })
    } catch (error) {
      // Never let a thumbnail-generation failure surface anywhere the
      // editor would see it — the original file (and its normal
      // document-icon placeholder on the frontend) still work fine
      // without a thumbnail.
      req.payload.logger.error(
        `PDF thumbnail generation failed for "${docFilename}": ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  })

  return doc
}
