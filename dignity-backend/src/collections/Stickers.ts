import type { CollectionConfig } from 'payload'

export const Stickers: CollectionConfig = {
  slug: 'stickers',
  labels: { singular: 'Sticker or Bookmark', plural: 'Stickers & Bookmarks' },
  admin: {
    group: 'Publications',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status'],
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
