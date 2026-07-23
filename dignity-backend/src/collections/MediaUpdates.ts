import type { CollectionConfig } from 'payload'

export const MediaUpdates: CollectionConfig = {
  slug: 'media-updates',
  admin: {
    group: 'Media & Updates',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'date', 'status'],
    description: 'News, Announcements, Photos, and Clippings all live here — use the Type column/filter to switch between them.',
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
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'News', value: 'news' },
        { label: 'Announcement', value: 'announcement' },
        { label: 'Photo', value: 'photo' },
        { label: 'Clipping', value: 'clipping' },
      ],
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
    },
  ],
}
