import type { CollectionConfig, Field, GlobalConfig } from 'payload'

/**
 * Bilingual (English + Arabic) enforcement.
 *
 * Every translatable field in this project is modelled as a pair of sibling
 * fields — `title` / `titleAr`, `description` / `descriptionAr`, `body` /
 * `bodyAr`, and so on. Historically only the English half carried
 * `required: true`, so it was possible to publish a document with English
 * content and no Arabic at all (or vice versa), which then rendered as a blank
 * section for half the site's visitors.
 *
 * `enforceBilingual` walks a collection/global's field tree, finds every
 * `X` / `XAr` sibling pair, and wires up two guarantees:
 *
 *   1. Both-or-neither — filling one language while leaving the other empty is
 *      a validation error on the empty field. Optional fields stay optional:
 *      leaving BOTH halves empty is still allowed.
 *   2. Mirrored `required` — if the English half is `required: true`, the
 *      Arabic half becomes required too, so the admin UI shows the asterisk and
 *      the same rule is enforced from both sides.
 *
 * Applied centrally in payload.config.ts so every current and future collection
 * is covered automatically — there is no per-collection opt-in to forget.
 *
 * Drafts are exempt: an in-progress draft may be saved half-translated, but it
 * cannot be *published* until both languages are present.
 */

/** Fields that hold translatable prose. Non-text pairs are left alone. */
const TRANSLATABLE_TYPES = new Set(['text', 'textarea', 'richText'])

/**
 * True when a field value carries no meaningful content. Handles plain strings
 * and Lexical richText values (whose "empty" state is still a populated object
 * containing a single blank paragraph).
 */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''

  if (typeof value === 'object') {
    const root = (value as { root?: { children?: unknown[] } }).root
    if (root) {
      const children = root.children
      if (!Array.isArray(children) || children.length === 0) return true
      // Walk the tree; any non-blank text node means the field has content.
      const hasText = (node: unknown): boolean => {
        if (!node || typeof node !== 'object') return false
        const n = node as { type?: string; text?: string; children?: unknown[] }
        if (n.type === 'text') return typeof n.text === 'string' && n.text.trim() !== ''
        // Non-text leaves (uploads, relationships, horizontal rules…) count as content.
        if (!Array.isArray(n.children)) return n.type !== undefined && n.type !== 'paragraph'
        return n.children.some(hasText)
      }
      return !children.some(hasText)
    }
  }

  return false
}

/** Human-readable name for an error message, preferring the field's label. */
function describe(field: Field, fallbackName: string): string {
  const label = (field as { label?: unknown }).label
  if (typeof label === 'string' && label.trim() !== '') return label
  return fallbackName
}

type ValidateFn = (value: unknown, options: Record<string, unknown>) => unknown

/**
 * Build a validate function enforcing "the counterpart language is filled, so
 * this one must be too", chaining any validate the field already had.
 */
function pairedValidate(
  counterpartName: string,
  counterpartLabel: string,
  thisLabel: string,
  existing: ValidateFn | undefined,
): ValidateFn {
  return async (value, options) => {
    // Run the field's original validation first so we never silently drop it.
    if (typeof existing === 'function') {
      const prior = await existing(value, options)
      if (prior !== true && prior !== undefined) return prior
    }

    const siblingData = (options?.siblingData ?? {}) as Record<string, unknown>
    const data = (options?.data ?? {}) as Record<string, unknown>

    // Allow half-translated drafts; enforce completeness on publish.
    if (data._status === 'draft') return true

    const counterpartValue = siblingData[counterpartName]
    if (!isEmptyValue(counterpartValue) && isEmptyValue(value)) {
      return `"${thisLabel}" is required because "${counterpartLabel}" has content — every field must be provided in both English and Arabic.`
    }

    return true
  }
}

/** Recursively apply bilingual pairing to a field list. */
function processFields(fields: Field[]): Field[] {
  // Index sibling fields by name so pairs can find each other at this level.
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
    if (!name || !type || !TRANSLATABLE_TYPES.has(type)) return next

    // Determine this field's counterpart: `X` <-> `XAr`.
    const isArabic = name.endsWith('Ar')
    const counterpartName = isArabic ? name.slice(0, -2) : `${name}Ar`
    const counterpart = byName.get(counterpartName)
    if (!counterpart) return next
    if (!TRANSLATABLE_TYPES.has((counterpart as { type?: string }).type ?? '')) return next

    const thisLabel = describe(next, name)
    const counterpartLabel = describe(counterpart, counterpartName)

    const patched: Record<string, unknown> = {
      ...(next as Record<string, unknown>),
      validate: pairedValidate(
        counterpartName,
        counterpartLabel,
        thisLabel,
        (next as { validate?: ValidateFn }).validate,
      ),
    }

    // Mirror `required` from the English half onto the Arabic half so the admin
    // UI marks it required too. (Only English -> Arabic: the English field
    // already declares its own intent.)
    if (isArabic && (counterpart as { required?: boolean }).required) {
      patched.required = true
    }

    return patched as Field
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
