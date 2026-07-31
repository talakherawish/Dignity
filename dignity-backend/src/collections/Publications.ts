import type { CollectionConfig } from 'payload'

export const Publications: CollectionConfig = {
  slug: 'publications',
  admin: {
    group: 'Resources',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'date', 'status'],
    description:
      'Superseded — publications are now edited under Publications → Publications (the publications-items collection). Nothing here reaches the website.',
    // Two collections described the same thing and both appeared in the
    // sidebar, so an editor had no way to tell which one the site reads. It
    // reads `publications-items`; anything published here was invisible, which
    // is exactly what happened to "Collective Bargaining and Agreements".
    // Hidden rather than deleted, following Pages: the documents stay intact
    // and reachable through the API. /api/migrate-orphans copies anything left
    // here into the collection the site does read.
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
        { label: 'Books', value: 'books' },
        { label: 'Papers', value: 'papers' },
        { label: 'Reports', value: 'reports' },
        { label: 'Brochures', value: 'brochures' },
        { label: 'Theses', value: 'theses' },
        { label: 'Audiovisual', value: 'audiovisual' },
        { label: 'Posters', value: 'posters' },
      ],
    },
    {
      name: 'author',
      type: 'text',
      label: 'Author (English)',
    },
    {
      name: 'authorAr',
      type: 'text',
      label: 'Author (Arabic / المؤلف بالعربية)',
      admin: { rtl: true },
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
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'Downloadable File',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover Image',
    },
  ],
}
