import type { CollectionConfig } from 'payload'

export const Information: CollectionConfig = {
  slug: 'information',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status'],
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
      return Array.isArray(req.user.section) && req.user.section.includes('information')
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return Array.isArray(req.user.section) && req.user.section.includes('information')
    },
    delete: ({ req }) => req.user?.role === 'content-manager',
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
