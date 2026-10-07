import type { CollectionConfig, Field } from 'payload'
import { toSlug } from '../lib/slug'

/**
 * The two Information collections, matching the website's Information menu.
 *
 * They were one `information` collection with a `type` select whose description
 * told editors to "use the Type column/filter to switch between them" — a
 * sidebar line that did not exist on the site, hiding two pages behind a filter.
 * Nothing had ever been added to it, so the split cost no content.
 */

/** Title and description in both languages -- all a database itself needs. */
function describedFields(): Field[] {
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
  ]
}

function informationFields(): Field[] {
  return [
    ...describedFields(),
    {
      name: 'link',
      type: 'text',
      label: 'External Link (URL)',
      admin: {
        description: 'Shown to readers in both languages unless an Arabic-only link is set below.',
      },
    },
    {
      name: 'linkAr',
      type: 'text',
      label: 'External Link (Arabic only, if different / رابط عربي مختلف)',
      admin: {
        rtl: true,
        description: 'Only needed when the Arabic destination differs from the link above.',
      },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'Attached File',
      admin: {
        description: 'Shown to readers in both languages unless an Arabic-only file is set below.',
      },
    },
    {
      name: 'fileAr',
      type: 'upload',
      relationTo: 'media',
      label: 'Attached File (Arabic only, if different / نسخة عربية مختلفة)',
      admin: {
        description:
          'Only needed when the Arabic file is a different document from the one above. Leave empty to show the same file to everyone.',
      },
    },
  ]
}

function informationCollection(
  slug: string,
  singular: string,
  plural: string,
  description: string,
  fields: Field[],
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
    fields,
  }
}

export const ReadingsAndDocuments = informationCollection(
  'readings-documents',
  'Reading or Document',
  'Readings and Documents',
  'Shows on the website under Information → Readings and Documents.',
  informationFields(),
)

/**
 * Each item is one annotated bibliography -- the list itself, not a source in
 * it. Its sources are Bibliography Entries (src/collections/Bibliography.ts),
 * each pointing back at the database it belongs to. Until then a database was
 * a single item with a link and a file, like a reading; none had been created.
 */
const databases = informationCollection(
  'databases',
  'Database',
  'Databases',
  'One annotated bibliography, listed under Information → Databases. Its sources are added under Bibliography Entries.',
  [
    ...describedFields(),
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'Page address',
      admin: {
        position: 'sidebar',
        description:
          "Filled in automatically from the English title. It is the end of this database's web address, so changing it after the page has been shared will break the old link.",
      },
    },
  ],
)

export const Databases: CollectionConfig = {
  ...databases,
  admin: { ...databases.admin, defaultColumns: ['title', 'slug', 'updatedAt'] },
  hooks: {
    beforeValidate: [
      // As on Research: derived from the English title unless set by hand.
      ({ data }) => {
        if (data && !data.slug && typeof data.title === 'string') data.slug = toSlug(data.title)
        return data
      },
    ],
  },
}
