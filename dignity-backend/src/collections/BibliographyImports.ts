import type { CollectionConfig, Payload } from 'payload'
import { formatReport, importBibliography } from '../lib/bibliographyImport'

/**
 * Spreadsheet Imports: how the team loads an annotated bibliography without a
 * developer. An editor picks a database, attaches the .xlsx and saves; the
 * rows become ordinary Bibliography Entries (and Keywords), which are then
 * edited, published or deleted one by one like anything else. This item only
 * keeps the record of what the import did.
 *
 * The import runs in the background after the save, because a few hundred
 * rows take longer than a request should be kept waiting, and outside the
 * save's database transaction, which Atlas would time out. The item shows
 * "Running" until it finishes; reload it to see the report.
 *
 * The file itself isn't stored (disableLocalStorage) -- the entries are the
 * result, and the server's own disk doesn't survive a deploy anyway.
 */

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

async function record(payload: Payload, id: string | number, data: Record<string, unknown>) {
  // The import item's own save may not have committed yet when a very short
  // import finishes, so it is looked for a few times before giving up.
  for (let attempt = 1; ; attempt++) {
    try {
      return await payload.update({ collection: 'bibliography-imports', id, data })
    } catch (error) {
      if (attempt === 5) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}

export const BibliographyImports: CollectionConfig = {
  slug: 'bibliography-imports',
  labels: { singular: 'Spreadsheet Import', plural: 'Spreadsheet Imports' },
  admin: {
    group: 'Information',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'database', 'status', 'createdAt'],
    description:
      'Load a bibliography spreadsheet (.xlsx) into a database. Each row becomes a Bibliography Entry you can edit afterwards. The first row of the sheet must hold the column names: Type, Lang, Keywords, Names, Title, Book_title, Journal_name, Year, City, Publisher, Pages, Volume, Issue, URL, DOI, Editors, Annotations. Several names or keywords in one cell are separated by |. An optional second sheet named "Keywords", with English and Arabic columns, pairs each keyword with its translation. Rows already in the database (same title and year) are skipped, so a sheet can be imported again after adding rows to it.',
  },
  upload: {
    mimeTypes: [XLSX],
    disableLocalStorage: true,
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    // An import is a record of what happened; changing it afterwards would
    // only make the record wrong. The entries it made are what get edited.
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
        const database = typeof doc.database === 'object' ? doc.database.id : doc.database
        const dryRun = !!doc.dryRun

        // Not awaited, and not handed `req`: see the note at the top.
        void (async () => {
          try {
            const report = await importBibliography({
              payload,
              file,
              database: String(database),
              publish: !!doc.publish,
              dryRun,
            })
            await record(payload, doc.id, {
              status: report.failed.length ? 'doneWithErrors' : 'done',
              report: formatReport(report, dryRun),
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
      name: 'database',
      type: 'relationship',
      relationTo: 'databases',
      required: true,
      admin: { description: 'The database the entries go into. Create it under Databases first.' },
    },
    {
      name: 'publish',
      type: 'checkbox',
      label: 'Publish the entries straight away',
      admin: {
        description:
          'Left unticked, every entry is saved as a draft to be checked and published one by one.',
      },
    },
    {
      name: 'dryRun',
      type: 'checkbox',
      label: 'Check only -- create nothing',
      admin: {
        description:
          'Reads the sheet and reports what would be created, skipped and left untranslated, without changing anything.',
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
