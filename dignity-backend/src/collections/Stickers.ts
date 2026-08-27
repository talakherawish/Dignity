import type { CollectionConfig } from 'payload'

export const Stickers: CollectionConfig = {
  slug: 'stickers',
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status'],
    description: 'Shows on the website under About the Dignity Initiative → Stickers. Upload one sticker image per entry (click the Image field below to upload).',
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
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title (English)',
      admin: {
        description:
          'Optional caption, e.g. "Dignity Initiative sticker set". A sticker that speaks for itself can be left untitled.',
      },
    },
    {
      name: 'titleAr',
      type: 'text',
      label: 'Title (Arabic / العنوان بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        description: 'Optional. Shown under the caption when set.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Sticker Image',
    },
  ],
}
