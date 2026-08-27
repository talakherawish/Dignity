import type { CollectionConfig } from 'payload'
import { mirrorLinksOnChange, mirrorLinksOnDelete } from '../hooks/syncResearchLinks'

export const Clippings: CollectionConfig = {
  slug: 'clippings',
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status'],
    description: 'Shows on the website under About the Dignity Initiative → Clippings (press mentions, newspaper scans, etc). Upload a scanned image of the clipping in the Image field.',
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [mirrorLinksOnChange({ field: 'researchLines', relationTo: 'research', mirrorField: 'relatedClippings' })],
    afterDelete: [mirrorLinksOnDelete({ relationTo: 'research', mirrorField: 'relatedClippings' })],
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
      admin: {
        description: 'The headline or name of the publication this clipping is from.',
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
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Scanned Image',
    },
    {
      name: 'researchLines',
      type: 'relationship',
      relationTo: 'research',
      hasMany: true,
      label: 'Research Line(s)',
      admin: {
        position: 'sidebar',
        description: 'Which research line(s) this clipping is about. Shows up on that research line\'s page automatically.',
      },
    },
  ],
}
