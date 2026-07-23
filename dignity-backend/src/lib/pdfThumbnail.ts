import { pdf } from 'pdf-to-img'
import type { CollectionBeforeChangeHook } from 'payload'

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
 * How it works: runs as a `beforeChange` hook on the Media collection. When
 * the incoming file is a PDF, it rasterizes page 1 to a PNG buffer using
 * pdf-to-img (a thin, pure-npm wrapper around pdfjs-dist's Node-canvas-free
 * rendering path — no native binary dependency, safe for Vercel's build). It
 * then creates a second Media document from that PNG via `payload.create`,
 * which routes through the same upload pipeline (and therefore the same
 * GitHub storage adapter) as any normal upload, and stores that new
 * document's ID on this document's `thumbnail` relationship field.
 *
 * This only ever fires for `create` operations with an actual file attached
 * — editing metadata on an existing Media doc (e.g. fixing the alt text)
 * does not re-trigger thumbnail generation.
 */
export const generatePdfThumbnail: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data
  if (!req.file) return data
  if (req.file.mimetype !== 'application/pdf') return data

  try {
    const base64 = req.file.data.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64}`

    const document = await pdf(dataUrl, { scale: 2 })
    const firstPageBuffer = await document.getPage(1)

    if (!firstPageBuffer) return data

    const originalName = req.file.name.replace(/\.pdf$/i, '')
    const thumbnailFilename = `${originalName}-thumb.png`

    const thumbnailDoc = await req.payload.create({
      collection: 'media',
      data: {
        alt: `Preview of ${req.file.name}`,
      },
      file: {
        data: firstPageBuffer,
        mimetype: 'image/png',
        name: thumbnailFilename,
        size: firstPageBuffer.length,
      },
      req,
    })

    return {
      ...data,
      thumbnail: thumbnailDoc.id,
    }
  } catch (error) {
    // Never let a thumbnail-generation failure block the actual upload —
    // the original file (and its normal document-icon placeholder on the
    // frontend) still work fine without a thumbnail.
    req.payload.logger.error(
      `PDF thumbnail generation failed for "${req.file?.name}": ${error instanceof Error ? error.message : String(error)}`,
    )
    return data
  }
}
