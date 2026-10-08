import type { CollectionConfig, Field } from 'payload'
import { toSlug } from '../lib/slug'

/**
 * The two Information collections, matching the website's Information menu.
 *
 * They were one `information` collection with a `type` select whose description
 * told editors to "use the Type column/filter to switch between them" — a
 * sidebar line that did not exist on the site, hiding two pages behind a filter.
 * Nothing had ever been added to it, so the split cost no content.
 */

/** Title and description in both languages. */
function describedFields(descriptionLabel = 'Description'): Field[] {
  return [
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
      name: 'description',
      type: 'richText',
      label: `${descriptionLabel} (English)`,
    },
    {
      name: 'descriptionAr',
      type: 'richText',
      label: `${descriptionLabel} (Arabic / بالعربية)`,
    },
  ]
}

/** The end of the item's web address, filled in from the English title. */
const slugField = (noun: string): Field => ({
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  label: 'Page address',
  admin: {
    position: 'sidebar',
    description: `Filled in automatically from the English title. It is the end of this ${noun}'s web address, so changing it after the page has been shared will break the old link.`,
  },
})

/** As on Research: the slug is derived from the English title unless set by hand. */
const fillSlug: NonNullable<NonNullable<CollectionConfig['hooks']>['beforeValidate']>[number] = ({
  data,
}) => {
  if (data && !data.slug && typeof data.title === 'string') data.slug = toSlug(data.title)
  return data
}

function informationCollection(
  slug: string,
  singular: string,
  plural: string,
  description: string,
  fields: Field[],
  defaultColumns: string[],
): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Information',
      useAsTitle: 'title',
      defaultColumns,
      description,
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
    hooks: {
      beforeValidate: [fillSlug],
    },
    fields,
  }
}

/**
 * A reading: one text the team has read and written about -- the write-up in
 * both languages, the text itself where it can be hosted (a public-domain
 * book from Project Gutenberg, say), where it came from, and keywords from
 * the same list the Databases use.
 *
 * Built on the collection's original fields (title, description, link, file
 * and their Arabic halves), relabelled, so anything entered before keeps its
 * place. The citation is kept on the reading itself rather than pointing at a
 * Bibliography Entry: a reading is a curated handful, and making an editor
 * create an entry in some database first, just to cite one book, is a detour.
 */
export const ReadingsAndDocuments = informationCollection(
  'readings-documents',
  'Reading',
  'Readings and Documents',
  'A text the team has read and written about. Shows on the website under Information → Readings and Documents, each with its own page.',
  [
    ...describedFields('Write-up'),
    slugField('reading'),
    {
      type: 'collapsible',
      label: 'The text',
      fields: [
        {
          name: 'authors',
          type: 'array',
          label: 'Author(s) of the text',
          labels: { singular: 'Author', plural: 'Authors' },
          fields: [{ name: 'name', type: 'text', required: true }],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'year',
              type: 'text',
              label: 'Year first published',
              admin: { width: '25%' },
            },
            {
              name: 'language',
              type: 'select',
              label: 'Language of the text',
              defaultValue: 'en',
              admin: { width: '25%' },
              options: [
                { label: 'English', value: 'en' },
                { label: 'Arabic', value: 'ar' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'translator',
              type: 'text',
              label: 'Translated by',
              admin: { width: '50%', description: 'If the text is a translation.' },
            },
          ],
        },
        {
          name: 'sourceName',
          type: 'text',
          label: 'Source',
          admin: {
            description:
              'Where the text comes from, as readers should see it -- e.g. "Project Gutenberg, eBook #5682".',
          },
        },
        {
          name: 'rights',
          type: 'select',
          label: 'Why it can be shared',
          admin: {
            description:
              'Shown to readers next to the file. Only host a file that is public domain, openly licensed, or shared with permission -- otherwise give the link alone.',
          },
          options: [
            { label: 'Public domain', value: 'publicDomain' },
            { label: 'Open licence', value: 'openLicence' },
            { label: 'Shared with permission', value: 'permission' },
            { label: 'Link only -- not hosted here', value: 'linkOnly' },
          ],
        },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          label: 'The text (PDF)',
          admin: {
            description:
              'Shown to readers in both languages unless an Arabic-only file is set below.',
          },
        },
        {
          name: 'fileAr',
          type: 'upload',
          relationTo: 'media',
          label: 'The text in Arabic, if different (نسخة عربية مختلفة)',
          admin: {
            description:
              'Only needed when there is a separate Arabic edition or translation. Leave empty to show the same file to everyone.',
          },
        },
        {
          name: 'link',
          type: 'text',
          label: 'Link to the source (URL)',
          admin: {
            description:
              'The text online, e.g. its Project Gutenberg page. Shown in both languages unless an Arabic-only link is set below.',
          },
        },
        {
          name: 'linkAr',
          type: 'text',
          label: 'Link to the source (Arabic only, if different / رابط عربي مختلف)',
          admin: {
            rtl: true,
            description: 'Only needed when the Arabic destination differs from the link above.',
          },
        },
      ],
    },
    {
      name: 'keywords',
      type: 'relationship',
      relationTo: 'keywords',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'writtenBy',
      type: 'relationship',
      relationTo: 'participants',
      hasMany: true,
      label: 'Write-up by',
      admin: {
        position: 'sidebar',
        description:
          'Who read the text and wrote this up. Pick from the Working Group, or Create New.',
      },
    },
  ],
  ['title', 'year', 'updatedAt'],
)

/**
 * Each item is one annotated bibliography -- the list itself, not a source in
 * it. Its sources are Bibliography Entries (src/collections/Bibliography.ts),
 * each pointing back at the database it belongs to. Until then a database was
 * a single item with a link and a file, like a reading; none had been created.
 */
export const Databases = informationCollection(
  'databases',
  'Database',
  'Databases',
  'One annotated bibliography, listed under Information → Databases. Its entries, and the spreadsheets they were imported from, are managed below on its own page.',
  [
    ...describedFields(),
    slugField('database'),
    // Everything about a database is managed from its own page: the entries
    // in it, and the spreadsheets it was loaded from. Both are still their
    // own collections underneath -- that is what lets each entry be edited,
    // drafted and filtered on its own -- but they are kept out of the sidebar
    // (admin.group: false on each), so Databases is the one place to go.
    {
      name: 'entries',
      type: 'join',
      collection: 'bibliography-entries',
      on: 'database',
      label: 'Entries',
      defaultLimit: 25,
      defaultSort: 'title',
      admin: {
        defaultColumns: ['title', 'entryType', 'year', '_status'],
        description:
          'Every source in this database. "Add new" creates one here; click an entry to edit it. To delete many at once, open the full list at /admin/collections/bibliography-entries, filter by this database, select and delete.',
      },
    },
    {
      name: 'imports',
      type: 'join',
      collection: 'bibliography-imports',
      on: 'database',
      label: 'Import a spreadsheet',
      defaultSort: '-createdAt',
      admin: {
        defaultColumns: ['filename', 'status', 'createdAt'],
        description:
          '"Add new" to load a bibliography spreadsheet (.xlsx) into this database: each row becomes an entry above. It runs in the background -- reload this page after a minute to see the entries and the import\'s report.',
      },
    },
  ],
  ['title', 'slug', 'updatedAt'],
)
