import type { CollectionConfig, CollectionSlug, Payload } from 'payload'
import { formatReport, importBibliography, type ImportReport } from '../lib/bibliographyImport'
import { importReadings } from '../lib/readingsImport'

/**
 * Spreadsheet Imports: how the team loads a list of sources without a
 * developer -- an annotated bibliography into a database, or readings into a
 * Readings and Documents subject. An editor attaches the .xlsx on the
 * subject's own page and saves; the rows become ordinary items (and Keywords),
 * which are then edited, published or deleted one by one like anything else.
 * This item only keeps the record of what the import did.
 *
 * The import runs in the background after the save, because a few hundred
 * rows take longer than a request should be kept waiting, and outside the
 * save's database transaction, which Atlas would time out. The item shows
 * "Running" until it finishes; reload it to see the report.
 *
 * The file itself isn't stored (disableLocalStorage) -- the items are the
 * result, and the server's own disk doesn't survive a deploy anyway.
 */

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

type Run = (args: {
  payload: Payload
  file: Buffer
  subject: string
  publish: boolean
  dryRun: boolean
}) => Promise<ImportReport>

function spreadsheetImports({
  slug,
  field,
  relationTo,
  items,
  description,
  run,
}: {
  slug: CollectionSlug
  /** The field naming the subject the rows go into. */
  field: string
  relationTo: CollectionSlug
  /** What the rows become, e.g. 'entries'. */
  items: string
  description: string
  run: Run
}): CollectionConfig {
  async function record(payload: Payload, id: string | number, data: Record<string, unknown>) {
    // The import item's own save may not have committed yet when a very short
    // import finishes, so it is looked for a few times before giving up.
    for (let attempt = 1; ; attempt++) {
      try {
        return await payload.update({ collection: slug, id, data })
      } catch (error) {
        if (attempt === 5) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  return {
    slug,
    labels: { singular: 'Spreadsheet Import', plural: 'Spreadsheet Imports' },
    admin: {
      // Out of the sidebar: an import is started from its subject's own page
      // (the "Import a spreadsheet" join), which fills in the subject by itself.
      group: false,
      useAsTitle: 'filename',
      defaultColumns: ['filename', field, 'status', 'createdAt'],
      description,
    },
    upload: {
      mimeTypes: [XLSX],
      disableLocalStorage: true,
    },
    access: {
      read: ({ req }) => !!req.user,
      create: ({ req }) => !!req.user,
      // An import is a record of what happened; changing it afterwards would
      // only make the record wrong. The items it made are what get edited.
      update: () => false,
      delete: ({ req }) => !!req.user,
    },
    hooks: {
      beforeChange: [
        ({ data, operation, req }) => {
          if (operation !== 'create') return data
          // Kept for afterChange: the upload is only on the request.
          req.context.importFile = req.file?.data
          return { ...data, status: 'running', report: '' }
        },
      ],
      afterChange: [
        ({ doc, operation, req }) => {
          const file = req.context.importFile as Buffer | undefined
          if (operation !== 'create' || !file) return doc
          const { payload } = req
          const subject = typeof doc[field] === 'object' ? doc[field].id : doc[field]
          const dryRun = !!doc.dryRun

          // Not awaited, and not handed `req`: see the note at the top.
          void (async () => {
            try {
              const report = await run({
                payload,
                file,
                subject: String(subject),
                publish: !!doc.publish,
                dryRun,
              })
              await record(payload, doc.id, {
                status: report.failed.length ? 'doneWithErrors' : 'done',
                report: formatReport(report, dryRun, items),
              })
            } catch (error) {
              payload.logger.error({ err: error }, `Spreadsheet import ${doc.id} failed`)
              await record(payload, doc.id, {
                status: 'failed',
                report: `The import stopped: ${(error as Error).message}`,
              }).catch(() => undefined)
            }
          })()
          return doc
        },
      ],
    },
    fields: [
      {
        name: field,
        type: 'relationship',
        relationTo,
        required: true,
        admin: { description: `Where the ${items} go.` },
      },
      {
        name: 'publish',
        type: 'checkbox',
        label: `Publish the ${items} straight away`,
        admin: {
          description: `Left unticked, the ${items} are saved as drafts to be checked and published one by one.`,
        },
      },
      {
        name: 'dryRun',
        type: 'checkbox',
        label: 'Check only -- create nothing',
        admin: {
          description:
            'Reads the sheet and reports what would be created, skipped, flagged as similar and left untranslated, without changing anything.',
        },
      },
      {
        name: 'status',
        type: 'select',
        admin: { position: 'sidebar', readOnly: true },
        options: [
          { label: 'Running -- reload to see when it finishes', value: 'running' },
          { label: 'Done', value: 'done' },
          { label: 'Done, with some rows failed', value: 'doneWithErrors' },
          { label: 'Failed', value: 'failed' },
        ],
      },
      {
        name: 'report',
        type: 'textarea',
        admin: { readOnly: true, rows: 16 },
      },
    ],
  }
}

const SHARED_RULES =
  'Several names or keywords in one cell are separated by |. An optional second sheet named "Keywords", with English and Arabic columns, pairs each keyword with its translation. Rows already there, or repeated in the sheet (same title and year, ignoring capitals and punctuation), are skipped, so a sheet can be imported again after adding rows to it. Rows and keywords that are only similar to existing ones (a typo, a hyphen, a dropped subtitle) are imported but listed in the report for checking.'

export const BibliographyImports = spreadsheetImports({
  slug: 'bibliography-imports',
  field: 'database',
  relationTo: 'databases',
  items: 'entries',
  description: `Load a bibliography spreadsheet (.xlsx) into a database. Each row becomes a Bibliography Entry you can edit afterwards. The first row of the sheet must hold the column names: Type, Lang, Keywords, Names, Title, Book_title, Journal_name, Year, City, Publisher, Pages, Volume, Issue, URL, DOI, Editors, Annotations. ${SHARED_RULES}`,
  run: ({ subject, ...args }) => importBibliography({ ...args, database: subject }),
})

export const ReadingImports = spreadsheetImports({
  slug: 'reading-imports',
  field: 'subject',
  relationTo: 'reading-lists',
  items: 'readings',
  description: `Load a list of readings and documents (.xlsx) into a subject. Each row becomes a Reading you can edit afterwards. The first row of the sheet must hold the column names; Title is the only one required. Also read: Type, Lang, Names (authors), Source, Year, URL, Keywords, Note, Note_ar, Internal note, and Other_title and Other_URL for the same source in the other language. A bibliography export (Book_title, Journal_name, Website_name, Publisher, Page_url ...) is read too. ${SHARED_RULES}`,
  run: importReadings,
})
