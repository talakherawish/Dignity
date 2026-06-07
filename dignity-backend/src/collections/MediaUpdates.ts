import type { CollectionConfig } from 'payload'

export const MediaUpdates: CollectionConfig = {
  slug: 'media-updates',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'date', 'status'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return req.user.section === 'media'
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return req.user.section === 'media'
    },
    delete: ({ req }) => req.user?.role === 'content-manager',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
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
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
