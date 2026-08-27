import type { CollectionConfig } from 'payload'

export const Conferences: CollectionConfig = {
  slug: 'conferences',
  admin: {
    group: 'Activities',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status', 'updatedAt'],
    description:
      'Conferences organized through the Dignity initiative. Appears on the website under Activities -> Forums, filtered as Conference.',
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
  ],
}
