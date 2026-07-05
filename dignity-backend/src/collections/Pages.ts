import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'title', 'updatedAt'],
    description: 'One entry per page on the site (About, Mission and Vision, Partners, etc). Edit the text below and it updates the live site.',
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
      return Array.isArray(req.user.section) && req.user.section.includes('pages' as any)
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return Array.isArray(req.user.section) && req.user.section.includes('pages' as any)
    },
    delete: ({ req }) => req.user?.role === 'content-manager',
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Page Identifier (do not change after creation)',
      admin: {
        description: 'Matches a fixed page on the site, e.g. about, mission, partners. Do not edit unless you know what this connects to.',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Page Title (English)',
    },
    {
      name: 'titleAr',
      type: 'text',
      label: 'Page Title (Arabic)',
      admin: { rtl: true },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Short Intro Shown Under the Title (English)',
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Short Intro Shown Under the Title (Arabic)',
      admin: { rtl: true },
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Full Page Content (English)',
    },
    {
      name: 'bodyAr',
      type: 'richText',
      label: 'Full Page Content (Arabic)',
    },
    ],
}
