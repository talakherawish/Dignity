import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'updatedAt'],
  },
  // Enable draft/publish — nothing goes live until content manager publishes
  versions: {
    drafts: true,
  },
  access: {
    // Anyone logged in can read (admin panel); public can only read published
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    // Editors assigned to 'articles' section + content managers can create
    create: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return req.user.section === 'articles'
    },
    // Same as create
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return req.user.section === 'articles'
    },
    // Only content managers can delete
    delete: ({ req }) => req.user?.role === 'content-manager',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Short Summary',
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Full Content',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover Image',
    },
  ],
}
