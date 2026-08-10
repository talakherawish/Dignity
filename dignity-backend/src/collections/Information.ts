import type { CollectionConfig, Field } from 'payload'

/**
 * The two Information collections, matching the website's Information menu.
 *
 * They were one `information` collection with a `type` select whose description
 * told editors to "use the Type column/filter to switch between them" — a
 * sidebar line that did not exist on the site, hiding two pages behind a filter.
 * Nothing had ever been added to it, so the split cost no content.
 */

function informationFields(): Field[] {
  return [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Title (English)',
    },
    {
      name: 'titleAr',
      type: 'text',
      label: 'Title (Arabic / العنوان بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description (English)',
    },
    {
      name: 'descriptionAr',
      type: 'richText',
      label: 'Description (Arabic / الوصف بالعربية)',
    },
    {
      name: 'link',
      type: 'text',
      label: 'External Link (URL)',
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'Attached File',
    },
  ]
}

function informationCollection(
  slug: string,
  singular: string,
  plural: string,
  description: string,
): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Information',
      useAsTitle: 'title',
      defaultColumns: ['title', 'updatedAt'],
      description,
    },
    versions: {
      drafts: true,
    },
    access: {
      read: ({ req }) => {
        if (req.user) return true
        return { _status: { equals: 'published' } }
      },
      create: ({ req }) => !!req.user,
      update: ({ req }) => !!req.user,
      delete: ({ req }) => !!req.user,
    },
    fields: informationFields(),
  }
}

export const ReadingsAndDocuments = informationCollection(
  'readings-documents',
  'Reading or Document',
  'Readings and Documents',
  'Shows on the website under Information → Readings and Documents.',
)

export const Databases = informationCollection(
  'databases',
  'Database',
  'Databases',
  'Shows on the website under Information → Databases.',
)
