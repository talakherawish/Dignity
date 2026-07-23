import type { CollectionConfig } from 'payload'

export const Information: CollectionConfig = {
  slug: 'information',
  admin: {
    group: 'Resources',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status'],
    description: 'Readings and Documents, and Databases live here — use the Type column/filter to switch between them.',
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
        { label: 'Readings and Documents', value: 'readings-documents' },
        { label: 'Databases', value: 'databases' },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description (English)',
    },
    {
      name: 'descriptionAr',
      type: 'richText',
      label: 'Description (Arabic / الوصف بالعربية)',
    },
    {
      name: 'link',
      type: 'text',
      label: 'External Link (URL)',
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'Attached File',
    },
  ],
}
