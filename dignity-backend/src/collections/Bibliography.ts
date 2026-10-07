import type { CollectionConfig, Field, FieldAccess, PayloadRequest } from 'payload'

/**
 * The annotated bibliographies behind Information → Databases.
 *
 * A database (src/collections/Information.ts) is just a named list. Its
 * contents are Bibliography Entries -- one per source -- and both entries and
 * readings are tagged from one shared Keywords collection.
 *
 * The fields mirror the team's spreadsheets, which are Zotero exports (Type,
 * Lang, Keywords, Names, Title, Book_title, Journal_name, ... Annotations), so
 * a sheet can be loaded with scripts/import-bibliography.ts instead of typed in.
 *
 * Keywords are their own collection rather than free text on each entry
 * because free text is how the reference site (Muwatin's databases) ended up
 * with "Clientalism" and "Clientelism", or "Demorcratization", as separate
 * filters.
 */

const signedIn: FieldAccess = ({ req }) => !!req.user

/**
 * A keyword already spelled this way, ignoring case and surrounding spaces.
 * Not a database `unique` index: those treat two empty values as a clash,
 * and most keywords are empty on one side.
 */
async function notTaken(
  field: 'name' | 'nameAr',
  value: unknown,
  req: PayloadRequest,
  id?: string | number,
) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return true
  // `like` is a case-insensitive contains; the exact comparison is below.
  // Deliberately not passed `req`: both name fields validate at once, and two
  // reads running together inside the save's transaction make MongoDB abort it.
  const { docs } = await req.payload.find({
    collection: 'keywords',
    where: { [field]: { like: text } },
    pagination: false,
    depth: 0,
  })
  const clash = docs.find(
    (d) =>
      d.id !== id &&
      String(d[field] ?? '')
        .trim()
        .toLowerCase() === text.toLowerCase(),
  )
  return clash ? `"${text}" is already a keyword -- pick it from the list instead.` : true
}

/**
 * Not run through the title-mirroring in src/lib/bilingual.ts: a keyword may
 * exist in only one language (Arabic sources get Arabic keywords that have no
 * English yet), so neither half is required -- only that one is filled in.
 */
export const Keywords: CollectionConfig = {
  slug: 'keywords',
  labels: { singular: 'Keyword', plural: 'Keywords' },
  admin: {
    group: 'Information',
    useAsTitle: 'label',
    defaultColumns: ['name', 'nameAr', 'updatedAt'],
    description:
      'The shared tag list for Databases and Readings. Pick from it rather than creating near-duplicates -- every keyword becomes a filter on the website.',
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        const en = data.name?.trim()
        const ar = data.nameAr?.trim()
        data.label = en && ar ? `${en} / ${ar}` : en || ar
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Keyword (English)',
      validate: async (value: unknown, { siblingData, req, id }: any) => {
        if (!value && !siblingData?.nameAr) return 'Fill in the keyword in at least one language.'
        return notTaken('name', value, req, id)
      },
    },
    {
      name: 'nameAr',
      type: 'text',
      label: 'Keyword (Arabic / الكلمة المفتاحية بالعربية)',
      admin: { rtl: true },
      validate: async (value: unknown, { req, id }: any) => notTaken('nameAr', value, req, id),
    },
    {
      // Set from the two names above on save; it's what the admin shows in
      // pickers and lists, so an Arabic-only keyword isn't a blank row.
      name: 'label',
      type: 'text',
      admin: { hidden: true },
    },
  ],
}

const nameList = (name: string, label: string, singular: string): Field => ({
  name,
  type: 'array',
  label,
  labels: { singular, plural: label },
  fields: [{ name: 'name', type: 'text', required: true }],
})

export const BibliographyEntries: CollectionConfig = {
  slug: 'bibliography-entries',
  labels: { singular: 'Bibliography Entry', plural: 'Bibliography Entries' },
  admin: {
    group: 'Information',
    useAsTitle: 'title',
    defaultColumns: ['title', 'database', 'entryType', 'year', 'updatedAt'],
    listSearchableFields: ['title', 'containerTitle', 'authors.name'],
    description:
      'One source in an annotated bibliography. Shows on the website inside its database, under Information → Databases.',
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
      name: 'database',
      type: 'relationship',
      relationTo: 'databases',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'entryType',
      type: 'select',
      label: 'Type',
      required: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'Book', value: 'book' },
        { label: 'Book chapter', value: 'bookChapter' },
        { label: 'Journal article', value: 'journalArticle' },
        { label: 'Other article', value: 'otherArticle' },
        { label: 'Report', value: 'report' },
        { label: 'Thesis', value: 'thesis' },
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
      admin: {
        position: 'sidebar',
        description: 'Also sets the direction the title and annotation are shown in.',
      },
      options: [
        { label: 'English', value: 'en' },
        { label: 'Arabic', value: 'ar' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'isTranslation',
      type: 'checkbox',
      label: 'Is a translation',
      admin: { position: 'sidebar' },
    },
    {
      // In the source's own language -- a citation isn't translated.
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description:
          "In the source's own language. For a chapter or article, the chapter or article; for a whole book, the book.",
      },
    },
    nameList('authors', 'Authors', 'Author'),
    {
      name: 'containerTitle',
      type: 'text',
      label: 'Published in',
      admin: {
        description:
          'The book a chapter is in, or the journal or website an article is in. Leave empty for a whole book.',
      },
    },
    nameList('editors', 'Editors', 'Editor'),
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'text', admin: { width: '20%' } },
        { name: 'publisher', type: 'text', admin: { width: '40%' } },
        { name: 'city', type: 'text', label: 'Place of publication', admin: { width: '40%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'volume', type: 'text', admin: { width: '20%' } },
        { name: 'issue', type: 'text', admin: { width: '20%' } },
        { name: 'pages', type: 'text', admin: { width: '20%' } },
        { name: 'edition', type: 'text', admin: { width: '20%' } },
        { name: 'reportType', type: 'text', label: 'Report type', admin: { width: '20%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'url', type: 'text', label: 'URL', admin: { width: '50%' } },
        { name: 'doi', type: 'text', label: 'DOI', admin: { width: '30%' } },
        { name: 'dateAccessed', type: 'text', label: 'Date accessed', admin: { width: '20%' } },
      ],
    },
    {
      // One annotation, written in whichever language it was written in --
      // the team annotates Arabic sources in Arabic and English ones in
      // English, so an EN/AR pair here would always be half empty.
      name: 'annotation',
      type: 'textarea',
      admin: { rows: 10 },
    },
    {
      name: 'keywords',
      type: 'relationship',
      relationTo: 'keywords',
      hasMany: true,
    },
    {
      type: 'collapsible',
      label: 'Access and copyright',
      fields: [
        {
          name: 'access',
          type: 'select',
          label: 'On the website',
          required: true,
          defaultValue: 'citation',
          options: [
            { label: 'Citation only', value: 'citation' },
            { label: 'Citation + link to the source', value: 'link' },
            { label: 'Citation + the file, hosted here', value: 'upload' },
          ],
        },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_, siblingData) => siblingData?.access === 'upload',
            description:
              'Only for texts that are public domain, openly licensed, or shared with permission.',
          },
        },
        {
          name: 'copyrightStatus',
          type: 'select',
          label: 'Copyright status',
          access: { read: signedIn },
          options: [
            { label: 'Copyrighted', value: 'copyrighted' },
            { label: 'Copyrighted -- verify', value: 'verify' },
            { label: 'Public domain', value: 'publicDomain' },
            { label: 'Open access -- verify licence', value: 'openAccess' },
            { label: 'Web content -- verify terms', value: 'webContent' },
          ],
        },
        {
          name: 'internalNote',
          type: 'textarea',
          label: 'Internal note',
          access: { read: signedIn },
          admin: { description: 'For the team only -- never shown on the website.' },
        },
      ],
    },
  ],
}
