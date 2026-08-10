import type { CollectionConfig, Field } from 'payload'

/**
 * The seven publication collections — one for each entry under Publications in
 * the website's navigation.
 *
 * These were a single `publications-items` collection carrying a `type` select,
 * so the sidebar showed one line ("Publications Items") where the site shows
 * seven pages, and choosing where an item belonged meant remembering to set a
 * dropdown rather than opening the section it was going into. The fields are
 * unchanged; only the `type` select is gone, because the collection an item
 * sits in now says what it is. Documents kept their ids through the split, so
 * every relationship pointing at them (see Research) still resolves.
 */

/** Shared by all seven — the field set the unified collection already used. */
function publicationFields(): Field[] {
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
      name: 'author',
      type: 'text',
      label: 'Author/Authors (English)',
    },
    {
      name: 'authorAr',
      type: 'text',
      label: 'Author/Authors (Arabic / المؤلف بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'date',
      type: 'date',
      label: 'Publication Date',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description (English)',
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Description (Arabic / الوصف بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'PDF or File',
    },
    {
      name: 'link',
      type: 'text',
      label: 'External Link (e.g. YouTube video)',
      admin: {
        description:
          'Use for items that live elsewhere rather than as an uploaded file — a YouTube video, for example. Leave empty when a file is attached above.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover Image or Thumbnail',
    },
  ]
}

function publicationCollection(
  slug: string,
  singular: string,
  plural: string,
  description: string,
): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Publications',
      useAsTitle: 'title',
      defaultColumns: ['title', 'author', 'date', 'updatedAt'],
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
    fields: publicationFields(),
  }
}

export const Books = publicationCollection(
  'books',
  'Book',
  'Books',
  'Shows on the website under Publications → Books.',
)

export const Papers = publicationCollection(
  'papers',
  'Paper',
  'Papers',
  'Shows on the website under Publications → Papers.',
)

export const Reports = publicationCollection(
  'reports',
  'Report',
  'Reports',
  'Shows on the website under Publications → Reports.',
)

export const Brochures = publicationCollection(
  'brochures',
  'Brochure',
  'Brochures',
  'Shows on the website under Publications → Brochures.',
)

export const Theses = publicationCollection(
  'theses',
  'Thesis',
  'Theses',
  'Shows on the website under Publications → Theses.',
)

export const Audiovisual = publicationCollection(
  'audiovisual',
  'Audiovisual Item',
  'Audiovisual',
  'Shows on the website under Publications → Audiovisual. Videos are usually a link rather than an upload.',
)

export const Posters = publicationCollection(
  'posters',
  'Poster',
  'Posters',
  'Shows on the website under Publications → Posters.',
)
