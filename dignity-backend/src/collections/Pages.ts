import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description:
      'Superseded — each page is now edited directly in the sidebar group it belongs to (About the Initiative, Mission & Vision, Partners, and so on).',
    // Replaced by one global per page (src/globals/pageGlobals.ts), which puts
    // each page under the sidebar group matching the website's navigation
    // instead of burying all 22 in a single undifferentiated list. Hidden
    // rather than deleted so the original documents remain intact and
    // recoverable through the API; nothing reads from this collection now.
    hidden: true,
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
