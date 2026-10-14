import type { ImageSize } from 'payload'

/**
 * Smaller copies of every uploaded image, so the website can stop sending a
 * 5MB original to fill a 350px card.
 *
 * Each copy keeps the original's proportions (width only, no crop) and is
 * re-encoded as WebP, which is where most of the saving comes from: a
 * screenshot saved as PNG is typically ten times the size of a WebP that
 * looks the same. The originals are untouched -- downloads and the
 * full-screen photo viewer still use them.
 *
 * The website lists every copy in an <img srcset> and the browser picks the
 * smallest one that is still sharp at the size it is shown, high-DPI screens
 * included -- see mediaSrcSet in the frontend's src/lib/payload.ts.
 *
 * A copy wider than the original is never made (Payload's default
 * `withoutEnlargement` behaviour): that size comes back with null fields, and
 * the website falls back to the original for it.
 *
 * Shared with the one-time backfill route (src/app/api/backfill-image-sizes)
 * so copies made for images uploaded before this existed are named and
 * encoded exactly as Payload makes them for new uploads.
 */
export const IMAGE_SIZE_WIDTHS = {
  small: 480,
  medium: 960,
  large: 1920,
} as const

export const WEBP_QUALITY = 80

export const imageSizes: ImageSize[] = Object.entries(IMAGE_SIZE_WIDTHS).map(([name, width]) => ({
  name,
  width,
  formatOptions: { format: 'webp', options: { quality: WEBP_QUALITY } },
}))

/** Mime types sharp can resize. SVGs and GIFs are left as they are. */
export const RESIZABLE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
