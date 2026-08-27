import type { CollectionConfig } from 'payload'

export const Meetings: CollectionConfig = {
  slug: 'meetings',
  admin: {
    group: 'Activities',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status', 'updatedAt'],
    description:
      'Meetings organized through the Dignity initiative. There is no separate Meetings page on the website any more -- every meeting appears under Activities -> Forums, so set its Forum Type below to say which type it is filed under.',
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
    /**
     * Some meetings are run as a round table or as a discussion; most are just
     * meetings. Left blank the website says nothing, so an ordinary meeting is
     * not labelled as anything.
     */
    {
      name: 'kind',
      type: 'select',
      label: 'Kind of Meeting (optional)',
      options: [
        { label: 'Round Table', value: 'roundtable' },
        { label: 'Discussion', value: 'discussion' },
      ],
      admin: {
        description:
          'Leave blank for an ordinary meeting. A round table or a discussion is labelled as such above its title on the website.',
      },
    },
    /**
     * Which of the four Forum sub-types this meeting is filed under. Every
     * meeting shows on Activities -> Forums regardless -- there is no
     * separate Meetings page any more -- but only a tagged one shows up
     * under one of the type filter tabs there; left blank, it still appears
     * under "All", just not under any specific tab, until an editor tags it.
     * Independent of `kind` above -- a meeting can carry both, or either
     * alone -- so tagging one never touches or loses the other.
     */
    {
      name: 'forumType',
      type: 'select',
      label: 'Forum Type',
      options: [
        { label: 'Seminar', value: 'seminar' },
        { label: 'Roundtable', value: 'roundtable' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Conference', value: 'conference' },
      ],
      admin: {
        description:
          'Which type of forum this is. Every meeting appears under Activities -> Forums either way; this decides which filter tab (Seminar/Roundtable/Workshop/Conference) it shows up under. Leave blank for now if unsure -- it will still appear under "All".',
      },
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
