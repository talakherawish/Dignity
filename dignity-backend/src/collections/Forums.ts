import type { CollectionConfig } from 'payload'

export const Forums: CollectionConfig = {
  slug: 'forums',
  admin: {
    group: 'Activities',
    useAsTitle: 'title',
    defaultColumns: ['title', 'forumType', 'date', 'status', 'updatedAt'],
    description:
      'Seminars, roundtables, workshops, and conferences organized through the Dignity initiative. Appears on the website under Activities -> Forums, filterable by Forum Type. Replaces the old separate Seminars, Conferences, and Meetings collections -- see scripts/merge-seminars-conferences-meetings-into-forums.ts.',
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
     * Which of the four sub-types this is. Required -- every document here is
     * a forum event, and this is what the filter tabs on Activities -> Forums
     * key off. The handful of documents migrated in from the old Meetings
     * collection without a kind (see `kind` below) were left without this
     * set too, since guessing their type risked mischaracterizing real
     * events; Payload will ask for it the next time one of those is edited.
     */
    {
      name: 'forumType',
      type: 'select',
      label: 'Forum Type',
      required: true,
      options: [
        { label: 'Seminar', value: 'seminar' },
        { label: 'Roundtable', value: 'roundtable' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Conference', value: 'conference' },
      ],
    },
    /**
     * Legacy from the old Meetings collection, before Seminars, Conferences,
     * and Meetings were merged into this one. Only present on documents
     * migrated in from there that don't have a Forum Type yet -- a hint
     * toward what to tag them as, not something new entries should use.
     */
    {
      name: 'kind',
      type: 'select',
      label: 'Legacy Kind (from the old Meetings collection)',
      options: [
        { label: 'Round Table', value: 'roundtable' },
        { label: 'Discussion', value: 'discussion' },
      ],
      admin: {
        description:
          'Left over from before Seminars/Conferences/Meetings were merged into Forums. Only meaningful on documents migrated from the old Meetings collection that are still missing a Forum Type above -- set that instead for anything new.',
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
     * why the website shows the whole set only once a visitor opens the entry
     * -- the Forums list stays an even list of dates and titles whether an
     * entry carries photographs or not.
     */
    {
      name: 'gallery',
      type: 'array',
      label: 'More Images (optional)',
      labels: { singular: 'Image', plural: 'Images' },
      admin: {
        description:
          'Additional photographs for this entry. They appear only inside it, after a visitor opens it.',
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
