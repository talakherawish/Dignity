import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'title', 'updatedAt'],
    description: 'Shows on the website under About the Dignity Initiative → About the Initiative / Mission and Vision / Partners. The Page Identifier tells you which one each entry is (about / mission / partners) — edit the text fields below to change what shows on the live site.',
  },
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req }) => req.user?.role === 'content-manager',
    update: ({ req }) => req.user?.role === 'content-manager',
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
