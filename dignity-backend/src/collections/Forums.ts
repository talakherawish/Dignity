import type { CollectionConfig } from 'payload'
import { mirrorLinksOnChange, mirrorLinksOnDelete } from '../hooks/syncResearchLinks'

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
  hooks: {
    afterChange: [
      mirrorLinksOnChange({ field: 'researchLines', relationTo: 'research', mirrorField: 'relatedForums' }),
      mirrorLinksOnChange({ field: 'taskForceAILines', relationTo: 'task-force-ai', mirrorField: 'relatedForums' }),
      mirrorLinksOnChange({ field: 'ideaFactoryLines', relationTo: 'idea-factory', mirrorField: 'relatedForums' }),
      mirrorLinksOnChange({ field: 'windsorBirzeitLines', relationTo: 'windsor-birzeit', mirrorField: 'relatedForums' }),
    ],
    afterDelete: [
      mirrorLinksOnDelete({ relationTo: 'research', mirrorField: 'relatedForums' }),
      mirrorLinksOnDelete({ relationTo: 'task-force-ai', mirrorField: 'relatedForums' }),
      mirrorLinksOnDelete({ relationTo: 'idea-factory', mirrorField: 'relatedForums' }),
      mirrorLinksOnDelete({ relationTo: 'windsor-birzeit', mirrorField: 'relatedForums' }),
    ],
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
     * Which of the five sub-types this is. Not required -- a handful of
     * documents migrated in from the old Meetings collection were left
     * without this set, since guessing their type risked mischaracterizing
     * real events, and a required field blocks saving *any* change to a
     * document (including unpublishing it) until it's filled in. It's what
     * the filter tabs on Activities -> Forums key off; left blank, an entry
     * still shows under "All" there, just not under a specific tab.
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
        { label: 'Encounters', value: 'encounters' },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Content (English)',
    },
    {
      name: 'contentAr',
      type: 'richText',
      label: 'Content (Arabic / المحتوى بالعربية)',
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
    /**
     * Files that belong to this forum -- a programme, a call for papers, a
     * concept note, the slides someone presented. Each row is the file plus
     * its name in both languages, and nothing else: the name is what a
     * visitor reads under the card, so a row with a file and no name would
     * show as an unlabelled thumbnail.
     *
     * Separate from Publications on purpose. A publication is a piece of work
     * in its own right, listed and searchable across the site; these are
     * papers attached to one event, shown only inside it.
     */
    {
      name: 'attachments',
      type: 'array',
      label: 'Additional Files (optional)',
      labels: { singular: 'File', plural: 'Files' },
      admin: {
        description:
          'Documents attached to this forum -- programme, concept note, slides, anything. They appear under Additional Information inside the entry, after a visitor opens it.',
      },
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'File',
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
      ],
    },
    /**
     * Who took part. Pick people who are already in the Working Group
     * collection, or add a new person here without leaving this page -- the
     * picker's "Create New" opens the full Participant form in a drawer.
     *
     * Someone created that way starts out kept off the public Working Group
     * page (see `hideFromWorkingGroupPage` on Participants, which is checked
     * by default for every new person). They still show here, and their
     * profile is still reachable from this forum, so adding a conference
     * speaker doesn't put them on a page meant for the initiative's own
     * people. Unchecking that box -- in the drawer while adding them, or
     * later in Working Group -- is what lists them there.
     */
    {
      name: 'participants',
      type: 'relationship',
      relationTo: 'participants',
      hasMany: true,
      label: 'Participants',
      admin: {
        description:
          'People who took part in this forum. Pick existing entries, or use Create New to add someone without leaving this page. A person added here is kept off the public Working Group page unless you uncheck "Keep off the Working Group page" on their profile.',
      },
    },
    {
      name: 'researchLines',
      type: 'relationship',
      relationTo: 'research',
      hasMany: true,
      label: 'Research Line(s)',
      admin: {
        position: 'sidebar',
        description: 'Which research line(s) this forum came out of. Shows up on that research line\'s page automatically.',
      },
    },
    {
      name: 'taskForceAILines',
      type: 'relationship',
      relationTo: 'task-force-ai',
      hasMany: true,
      label: 'Task Force on AI',
      admin: {
        position: 'sidebar',
        description: 'Shows up under that page\'s Activities section automatically.',
      },
    },
    {
      name: 'ideaFactoryLines',
      type: 'relationship',
      relationTo: 'idea-factory',
      hasMany: true,
      label: 'Idea Factory',
      admin: {
        position: 'sidebar',
        description: 'Shows up under that page\'s Activities section automatically.',
      },
    },
    {
      name: 'windsorBirzeitLines',
      type: 'relationship',
      relationTo: 'windsor-birzeit',
      hasMany: true,
      label: 'Windsor-Birzeit',
      admin: {
        position: 'sidebar',
        description: 'Shows up under that page\'s Activities section automatically.',
      },
    },
  ],
}
