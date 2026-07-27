import type { CollectionConfig } from 'payload'

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    group: 'Activities',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'date', 'status'],
    description: 'Superseded — add activities to Seminars, Conferences, Meetings, Research or The Windsor Birzeit Dignity Initiative instead.',
    // Superseded by the five per-activity collections (Seminars, Conferences,
    // Meetings, Research, WindsorDignity), which is where the website actually
    // reads from. Leaving this listed put a sixth, redundant entry in the
    // Activities group and made it ambiguous where a new activity should go —
    // anything added here would silently never appear on the site. Hidden
    // rather than deleted so existing documents remain reachable via the API
    // if anything still needs recovering from them.
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
        { label: 'Seminar', value: 'seminar' },
        { label: 'Conference', value: 'conference' },
        { label: 'Meeting', value: 'meeting' },
        { label: 'The Windsor Birzeit Dignity Initiative', value: 'windsor-birzeit' },
      ],
    },
    {
      name: 'date',
      type: 'date',
      required: true,
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
