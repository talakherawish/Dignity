import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'About the Dignity Initiative',
    // Listed by title rather than slug: the list previously showed raw
    // identifiers ("about", "mission", "publications-books"), which made the
    // editable About and Mission & Vision text genuinely hard to find.
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description:
      'The heading and intro text for each page on the site — including About the Initiative and Mission & Vision. Open an entry and edit the title, intro and body in English and Arabic; the live site updates to match. The Page Identifier column shows which page each entry drives.',
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
