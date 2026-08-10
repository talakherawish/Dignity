import type { CollectionConfig } from 'payload'

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status'],
    description: 'Shows on the website under About the Dignity Initiative → Announcements. Add a new entry here for each announcement.',
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
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Content (English)',
    },
    {
      name: 'contentAr',
      type: 'richText',
      label: 'Content (Arabic / المحتوى بالعربية)',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image (optional)',
    },
  ],
}
