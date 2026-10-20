import type { CollectionConfig } from 'payload'

/**
 * One reading or document in a Readings and Documents subject
 * (src/collections/Information.ts): a source that supports the subject,
 * without an annotation -- a text online, a hosted PDF, a declaration, a
 * video. Shown on the website as a row in its subject's list: type, title
 * linked to the source, authors, year, where it is from, an optional
 * one-line note, and keywords.
 *
 * No citation style: a reading is there to be opened, not cited, and most are
 * links. What the row shows is still enough to cite it by.
 *
 * A source often exists in both languages -- the Belmont Report in English and
 * in Arabic, Kant on Gutenberg and on an Arabic site. One reading holds both:
 * the source in its own language, and optionally its version in the other
 * language, which Arabic (or English) readers are shown first. Not named
 * `titleAr` etc.: those are the site's EN/AR translation pairs, and
 * enforceBilingual would make the Arabic one required.
 */
export const Readings: CollectionConfig = {
  slug: 'readings',
  labels: { singular: 'Reading', plural: 'Readings' },
  admin: {
    // Out of the sidebar: readings are managed from their subject's own
    // Readings tab (src/components/admin/SubjectEntriesView.tsx).
    group: false,
    useAsTitle: 'title',
    defaultColumns: ['title', 'itemType', 'year', 'language', '_status'],
    listSearchableFields: ['title', 'source', 'authors.name', 'otherVersion.title'],
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
      name: 'subject',
      type: 'relationship',
      relationTo: 'reading-lists',
      required: true,
      // "Create New" on a subject's Readings tab opens the form with
      // ?subject=<id>, so a new reading starts out in that subject.
      defaultValue: ({ req }) => req.searchParams?.get('subject') || undefined,
      admin: { position: 'sidebar' },
    },
    {
      name: 'itemType',
      type: 'select',
      label: 'Type',
      required: true,
      defaultValue: 'article',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Book', value: 'book' },
        { label: 'Book chapter', value: 'bookChapter' },
        { label: 'Article', value: 'article' },
        { label: 'Report', value: 'report' },
        { label: 'Document (declaration, code, law, charter)', value: 'document' },
        { label: 'Thesis', value: 'thesis' },
        { label: 'Video or audio', value: 'video' },
        { label: 'Website', value: 'website' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'language',
      type: 'select',
      label: 'Language of the source',
      required: true,
      defaultValue: 'en',
      admin: { position: 'sidebar' },
      options: [
        { label: 'English', value: 'en' },
        { label: 'Arabic', value: 'ar' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: "In the source's own language." },
    },
    {
      // Same or similar titles already in this subject, as the title is typed.
      name: 'similar',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '/components/admin/SimilarTitleNotice',
            clientProps: { field: 'subject', item: 'reading', subject: 'subject' },
          },
        },
      },
    },
    {
      name: 'authors',
      type: 'array',
      label: 'Authors (or the body that issued it)',
      labels: { singular: 'Author', plural: 'Authors' },
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'source',
          type: 'text',
          label: 'Where it is from',
          admin: {
            width: '75%',
            description:
              'The publisher, journal, website or organisation, e.g. "Project Gutenberg" or "World Medical Association".',
          },
        },
        { name: 'year', type: 'text', admin: { width: '25%' } },
      ],
    },
    {
      name: 'link',
      type: 'text',
      label: 'Link (URL)',
      admin: { description: 'Where the source can be read or watched online.' },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'File',
      admin: {
        description:
          'Only for documents that are public domain, openly licensed, or shared with permission. If there is both a link and a file, the file is offered as a download.',
      },
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Short note (English)',
      admin: {
        rows: 2,
        description:
          'Optional: a line on what it is or why it is here. Shown under the title on the website. Written in one language only, it is shown on both.',
      },
    },
    {
      name: 'noteAr',
      type: 'textarea',
      label: 'Short note (Arabic / ملاحظة قصيرة)',
      admin: { rows: 2, rtl: true },
    },
    {
      name: 'otherVersion',
      type: 'group',
      label: 'The same source in the other language',
      admin: {
        description:
          'If the source also exists in Arabic (or, for an Arabic source, in English) -- a translation or the official other-language edition. Readers of that language see this version first.',
      },
      fields: [
        { name: 'title', type: 'text', label: 'Title in the other language' },
        { name: 'link', type: 'text', label: 'Link (URL)' },
        { name: 'file', type: 'upload', relationTo: 'media', label: 'File' },
      ],
    },
    {
      name: 'keywords',
      type: 'relationship',
      relationTo: 'keywords',
      hasMany: true,
    },
    {
      name: 'internalNote',
      type: 'textarea',
      label: 'Internal note',
      access: { read: ({ req }) => !!req.user },
      admin: { description: 'For the team only -- never shown on the website.' },
    },
  ],
}
