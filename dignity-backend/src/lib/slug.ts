import type { CollectionSlug, PayloadRequest } from 'payload'

/** "Dignity of Children" -> "dignity-of-children". */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * The page address for `text` that nothing else in the collection has yet:
 * "test-person", or "test-person-2" if that is taken. Empty when the text has
 * no letters or digits to make one from.
 */
export async function uniqueSlug(
  req: PayloadRequest,
  collection: CollectionSlug,
  text: string | undefined,
  id?: string | number,
): Promise<string> {
  const base = text ? toSlug(text) : ''
  if (!base) return ''
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`
    const { totalDocs } = await req.payload.count({
      collection,
      where: { slug: { equals: slug }, ...(id ? { id: { not_equals: id } } : {}) },
      req,
    })
    if (totalDocs === 0) return slug
  }
}
