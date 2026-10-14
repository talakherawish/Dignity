'use client'
import { Button, useDocumentInfo } from '@payloadcms/ui'

/**
 * The button at the top of a database's Edit tab, shown once it exists:
 * "Download as spreadsheet" exports every entry, drafts included, as an .xlsx
 * in the same format the spreadsheet import reads -- see exportBibliography in
 * src/lib/bibliographyImport.ts and the endpoint on Databases
 * (src/collections/Information.ts).
 *
 * The entries themselves are on the Entries tab beside it (DatabaseEntriesView).
 */
export default function DatabaseActions() {
  const { id } = useDocumentInfo()
  if (!id) return null
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'calc(var(--base) / 2)',
        marginBottom: 'var(--base)',
      }}
    >
      <Button buttonStyle="secondary" el="anchor" url={`/api/databases/${id}/export`}>
        Download as spreadsheet
      </Button>
    </div>
  )
}
