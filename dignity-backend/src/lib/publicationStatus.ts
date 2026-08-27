import type { CollectionConfig } from 'payload'

/**
 * An explicit, always-visible "Published" / "Draft" value for collections
 * with a draft/publish workflow (`versions.drafts: true`).
 *
 * Payload already tracks this as the `_status` field and can show it via the
 * built-in `status` column, but that relies on the admin's own client bundle
 * and a viewer's own column preferences -- either of which can make the
 * indicator silently not show up. A plain virtual field is unambiguous: it
 * always renders as a real value in the list view and the document sidebar,
 * computed straight from `_status` on every read.
 *
 * Applied centrally in payload.config.ts, the same way enforceBilingual is,
 * so every collection with drafts gets it automatically -- see
 * src/lib/bilingual.ts for the sibling pattern.
 */
export function withPublicationStatus(collection: CollectionConfig): CollectionConfig {
  const versions = collection.versions
  const hasDrafts = typeof versions === 'object' && !!versions?.drafts
  if (!hasDrafts) return collection

  const field: CollectionConfig['fields'][number] = {
    name: 'publicationStatus',
    type: 'text',
    label: 'Published?',
    virtual: true,
    admin: {
      readOnly: true,
      position: 'sidebar',
      description: 'Read-only. Reflects the Publish / Save as Draft state above.',
    },
    hooks: {
      afterRead: [({ siblingData }) => (siblingData?._status === 'published' ? 'Published' : 'Draft')],
    },
  }

  const admin = collection.admin ?? {}
  const defaultColumns = admin.defaultColumns
    ? // "id" and "status" (Payload's own indicator) aren't worth showing twice
      // next to this -- drop "status" so the list view isn't cluttered with
      // two badges saying the same thing.
      ['publicationStatus', ...admin.defaultColumns.filter((c) => c !== 'status')]
    : undefined

  return {
    ...collection,
    admin: { ...admin, defaultColumns },
    fields: [...collection.fields, field],
  }
}
