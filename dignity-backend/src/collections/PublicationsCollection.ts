import type { CollectionConfig } from 'payload'

export const PublicationsCollection: CollectionConfig = {
  slug: 'publications-items',
  admin: {
    group: 'Publications',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status', 'updatedAt'],
    description: 'Books, papers, reports, brochures, theses, audiovisual, and posters produced by the Dignity initiative.',
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
      name: 'author',
      type: 'text',
      label: 'Author/Authors (English)',
    },
    {
      name: 'authorAr',
      type: 'text',
      label: 'Author/Authors (Arabic / المؤلف بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'date',
      type: 'date',
      label: 'Publication Date',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description (English)',
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Description (Arabic / الوصف بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'PDF or File',
    },
    {
      name: 'link',
      type: 'text',
      label: 'External Link (e.g. YouTube video)',
      admin: {
        description:
          'Use for items that live elsewhere rather than as an uploaded file — a YouTube video, for example. Leave empty when a file is attached above.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover Image or Thumbnail',
    },
  ],
}
