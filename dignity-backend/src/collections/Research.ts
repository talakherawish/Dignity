import type { CollectionConfig } from 'payload'

/** "Dignity of Children" -> "dignity-of-children". */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const Research: CollectionConfig = {
  slug: 'research',
  admin: {
    group: 'Activities',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    description:
      'Shows on the website under Activities → Research. Each entry gets its own page, where the publications, clippings and photos selected below appear alongside it.',
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // The slug is the entry's URL, so editors never have to think about it —
        // it's derived from the English title unless someone has set one by hand.
        if (data && !data.slug && typeof data.title === 'string') {
          data.slug = toSlug(data.title)
        }
        return data
      },
    ],
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
  fields: [
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
      type: 'textarea',
      label: 'Short Description (English)',
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Short Description (Arabic / الوصف بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Full Content (English)',
    },
    {
      name: 'contentAr',
      type: 'richText',
      label: 'Full Content (Arabic / المحتوى بالعربية)',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured Image',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'Page address',
      admin: {
        position: 'sidebar',
        description:
          'Filled in automatically from the English title. It is the end of this entry\'s web address, so changing it after the page has been shared will break the old link.',
      },
    },
    // The outputs of a research area, shown on its page beneath the write-up.
    // Each points at the collection that already holds those items, so nothing
    // is duplicated — an item is uploaded once and attached wherever it belongs.
    {
      name: 'relatedBooks',
      type: 'relationship',
      relationTo: 'books',
      hasMany: true,
      label: 'Books from this research',
      admin: {
        description: 'Select existing books or add new ones.',
      },
    },
    {
      name: 'relatedPapers',
      type: 'relationship',
      relationTo: 'papers',
      hasMany: true,
      label: 'Papers from this research',
    },
    {
      name: 'relatedReports',
      type: 'relationship',
      relationTo: 'reports',
      hasMany: true,
      label: 'Reports from this research',
    },
    {
      name: 'relatedBrochures',
      type: 'relationship',
      relationTo: 'brochures',
      hasMany: true,
      label: 'Brochures from this research',
    },
    {
      name: 'relatedTheses',
      type: 'relationship',
      relationTo: 'theses',
      hasMany: true,
      label: 'Theses from this research',
    },
    {
      name: 'relatedAudiovisual',
      type: 'relationship',
      relationTo: 'audiovisual',
      hasMany: true,
      label: 'Audiovisual from this research',
    },
    {
      name: 'relatedPosters',
      type: 'relationship',
      relationTo: 'posters',
      hasMany: true,
      label: 'Posters from this research',
    },
    {
      name: 'relatedClippings',
      type: 'relationship',
      relationTo: 'clippings',
      hasMany: true,
      label: 'Press clippings about this research',
    },
    {
      name: 'relatedPhotos',
      type: 'relationship',
      relationTo: 'photos',
      hasMany: true,
      label: 'Photos from this research',
    },
  ],
}
