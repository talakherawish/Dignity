import type { CollectionConfig } from 'payload'

export const Meetings: CollectionConfig = {
  slug: 'meetings',
  admin: {
    group: 'Activities',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status', 'updatedAt'],
    description: 'Meetings organized through the Dignity initiative.',
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
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Short Description (English)',
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Short Description (Arabic / الوصف بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Full Content (English)',
    },
    {
      name: 'contentAr',
      type: 'richText',
      label: 'Full Content (Arabic / المحتوى بالعربية)',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured Image (optional)',
    },
    /**
     * Extra images, beyond the featured one. Optional and often empty, which is
     * why the website shows the whole set only once a visitor opens the meeting
     * -- the list of meetings stays an even list of dates and titles whether an
     * entry carries photographs or not.
     */
    {
      name: 'gallery',
      type: 'array',
      label: 'More Images (optional)',
      labels: { singular: 'Image', plural: 'Images' },
      admin: {
        description:
          'Additional photographs for this meeting. They appear only inside the meeting, after a visitor opens it.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption (English)',
        },
        {
          name: 'captionAr',
          type: 'text',
          label: 'Caption (Arabic / التسمية بالعربية)',
          admin: { rtl: true },
        },
      ],
    },
  ],
}
