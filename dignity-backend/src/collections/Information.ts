import type { CollectionConfig, CollectionSlug, Field, PayloadRequest } from 'payload'
import { exportBibliography } from '../lib/bibliographyImport'
import { exportReadings } from '../lib/readingsImport'
import { toSlug } from '../lib/slug'

/**
 * The two Information sections, matching the website's Information menu:
 * Databases and Readings and Documents. Each is a list of subjects, and each
 * subject has its own page on the website listing its items:
 *
 * - a database's items are Bibliography Entries (src/collections/Bibliography.ts):
 *   sources the team has read and annotated, cited in full;
 * - a Readings and Documents subject's items are Readings
 *   (src/collections/Readings.ts): sources and documents that support the
 *   subject, without annotations -- mostly links, sometimes hosted files.
 *
 * They are two collections, with their own sidebar links, rather than one with
 * a "kind" switch: the people editing aren't all technical, and a switch that
 * decides which page something lands on is easy to get wrong.
 *
 * Both work the same way in the admin. The list opens with the heading and
 * introduction of the website page itself (a page-text global, edited in place
 * by PageTextPanel), then lists the subjects. Clicking one opens its items tab:
 * the full items table -- search, filters, select, delete -- limited to that
 * subject (SubjectEntriesView). Its title, description, spreadsheet download
 * and spreadsheet imports are on the "Edit" tab beside it. Items and imports
 * are their own collections underneath, kept out of the sidebar.
 *
 * No draft/publish state on a subject: it is only a title and a description,
 * and its items carry their own.
 */

/** Title and description in both languages. */
function describedFields(): Field[] {
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
      label: 'Description (English)',
    },
    {
      name: 'descriptionAr',
      type: 'richText',
      label: 'Description (Arabic / بالعربية)',
    },
  ]
}

/** The end of the subject's web address, filled in from the English title. */
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

function subjectCollection({
  slug,
  singular,
  plural,
  description,
  pageText,
  items,
  field,
  imports,
  tab,
  exportFile,
}: {
  slug: CollectionSlug
  singular: string
  plural: string
  description: string
  /** The page-text global for the website page listing these subjects. */
  pageText: string
  /** The items collection, and the field on it naming the subject. */
  items: CollectionSlug
  field: string
  /** The spreadsheet-imports collection for these items. */
  imports: CollectionSlug
  /** The items tab: its label, and its path under the subject. */
  tab: { label: string; path: string }
  /** The subject's items as an .xlsx, in the import's own format. */
  exportFile: (req: PayloadRequest, id: string) => Promise<Buffer>
}): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Information',
      useAsTitle: 'title',
      defaultColumns: ['title', 'slug', 'updatedAt'],
      description,
      components: {
        beforeList: [
          {
            path: '/components/admin/PageTextPanel',
            clientProps: { global: pageText, pageName: plural, listed: plural.toLowerCase() },
          },
        ],
        views: {
          edit: {
            items: {
              Component: {
                path: '/components/admin/SubjectEntriesView',
                serverProps: { items, field },
              },
              path: `/${tab.path}`,
              tab: { label: tab.label, href: `/${tab.path}`, order: 50 },
            },
          },
        },
      },
    },
    access: {
      read: () => true,
      create: ({ req }) => !!req.user,
      update: ({ req }) => !!req.user,
      delete: ({ req }) => !!req.user,
    },
    hooks: {
      beforeValidate: [fillSlug],
    },
    fields: [
      ...describedFields().map((f) =>
        'name' in f && f.name === 'title'
          ? ({
              ...f,
              admin: {
                ...f.admin,
                components: {
                  Cell: {
                    path: '/components/admin/SubjectTitleCell',
                    clientProps: { tab: tab.path },
                  },
                },
              },
            } as Field)
          : f,
      ),
      slugField(singular.toLowerCase()),
      {
        name: 'actions',
        type: 'ui',
        admin: { components: { Field: '/components/admin/SubjectActions' } },
      },
      {
        name: 'imports',
        type: 'join',
        collection: imports,
        on: field,
        label: 'Import a spreadsheet',
        defaultSort: '-createdAt',
        admin: { defaultColumns: ['filename', 'status', 'createdAt'] },
      },
    ],
    endpoints: [
      {
        // GET /api/<subjects>/:id/export -- the subject's items as an .xlsx in
        // the import's own format. Signed-in only: it carries the internal
        // notes the website never shows.
        path: '/:id/export',
        method: 'get',
        handler: async (req) => {
          if (!req.user) return Response.json({ error: 'Sign in first.' }, { status: 403 })
          const id = String(req.routeParams?.id ?? '')
          const subject = await req.payload
            .findByID({ collection: slug, id, depth: 0 })
            .catch(() => null)
          if (!subject) return Response.json({ error: 'Not found.' }, { status: 404 })
          const file = await exportFile(req, id)
          const name = String((subject as { slug?: string }).slug || slug).replace(
            /[^a-z0-9-]/gi,
            '-',
          )
          return new Response(new Uint8Array(file), {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': `attachment; filename="${name}.xlsx"`,
            },
          })
        },
      },
    ],
  }
}

export const Databases = subjectCollection({
  slug: 'databases',
  singular: 'Database',
  plural: 'Databases',
  description:
    'Each database is one subject: sources the team has read and annotated, with its own page on the website. Click a database to see and edit its entries.',
  pageText: 'databases-page',
  items: 'bibliography-entries',
  field: 'database',
  imports: 'bibliography-imports',
  tab: { label: 'Entries', path: 'entries' },
  exportFile: (req, id) => exportBibliography(req.payload, id),
})

export const ReadingLists = subjectCollection({
  slug: 'reading-lists',
  singular: 'Subject',
  plural: 'Readings and Documents',
  description:
    'Each subject has its own page on the website listing readings and documents that support it -- links and files, without annotations. Click a subject to see and edit its readings.',
  pageText: 'readings-page',
  items: 'readings',
  field: 'subject',
  imports: 'reading-imports',
  tab: { label: 'Readings', path: 'readings' },
  exportFile: (req, id) => exportReadings(req.payload, id),
})
