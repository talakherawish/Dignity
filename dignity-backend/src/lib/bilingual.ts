import type { CollectionConfig, Field, GlobalConfig } from 'payload'

/**
 * Bilingual (English + Arabic) field pairing.
 *
 * Every translatable field in this project is modelled as a pair of sibling
 * fields — `title` / `titleAr`, `description` / `descriptionAr`, `body` /
 * `bodyAr`, and so on.
 *
 * Titles are the one pair every collection marks `required: true` on the
 * English half, so `enforceBilingual` mirrors that onto the Arabic half —
 * a document can't be published with a title in only one language.
 *
 * Every other pair is independent: an item may carry English-only,
 * Arabic-only, or fully bilingual content for its description, body, or
 * attachments. This used to be blocked — filling in one side forced the
 * other to be filled too, so a document with only an English write-up
 * couldn't be published at all. The frontend now tells a reader when the
 * field they're looking at doesn't exist in their active language (see
 * TranslationNotice and resolveAttachment) instead of the CMS refusing to
 * save half-translated content, so that block no longer serves a purpose.
 *
 * Applied centrally in payload.config.ts so every current and future
 * collection is covered automatically.
 */

const TRANSLATABLE_TYPES = new Set(['text', 'textarea', 'richText'])

/** Recursively mirror `required` from an English field onto its `...Ar` sibling. */
function processFields(fields: Field[]): Field[] {
  const byName = new Map<string, Field>()
  for (const field of fields) {
    const name = (field as { name?: string }).name
    if (name) byName.set(name, field)
  }

  return fields.map((field) => {
    let next: Field = field

    // Recurse into container fields first.
    const container = next as { fields?: Field[]; tabs?: { fields: Field[] }[]; blocks?: { fields: Field[] }[] }
    if (Array.isArray(container.fields)) {
      next = { ...next, fields: processFields(container.fields) } as Field
    }
    if (Array.isArray(container.tabs)) {
      next = {
        ...next,
        tabs: container.tabs.map((tab) => ({ ...tab, fields: processFields(tab.fields) })),
      } as Field
    }
    if (Array.isArray(container.blocks)) {
      next = {
        ...next,
        blocks: container.blocks.map((block) => ({ ...block, fields: processFields(block.fields) })),
      } as Field
    }

    const name = (next as { name?: string }).name
    const type = (next as { type?: string }).type
    if (!name || !type || !TRANSLATABLE_TYPES.has(type) || !name.endsWith('Ar')) return next

    const english = byName.get(name.slice(0, -2))
    if (!english || !TRANSLATABLE_TYPES.has((english as { type?: string }).type ?? '')) return next
    if (!(english as { required?: boolean }).required) return next

    return { ...next, required: true } as Field
  })
}

/** Apply bilingual pairing rules to a collection. */
export function enforceBilingual(collection: CollectionConfig): CollectionConfig {
  return { ...collection, fields: processFields(collection.fields) }
}

/** Apply bilingual pairing rules to a global. */
export function enforceBilingualGlobal(global: GlobalConfig): GlobalConfig {
  return { ...global, fields: processFields(global.fields) }
}
