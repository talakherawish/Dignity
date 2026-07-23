import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    group: 'Content',
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
    // Any logged-in user can create
    create: ({ req }) => !!req.user,
    // Any logged-in user can update
    update: ({ req }) => !!req.user,
    // Any logged-in user can delete
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
      name: 'excerpt',
      type: 'textarea',
      label: 'Short Summary (English)',
    },
    {
      name: 'excerptAr',
      type: 'textarea',
      label: 'Short Summary (Arabic / الملخص بالعربية)',
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
      label: 'Cover Image',
    },
  ],
}
