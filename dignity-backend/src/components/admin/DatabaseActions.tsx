'use client'
import { Button, useDocumentInfo } from '@payloadcms/ui'

/**
 * The buttons at the top of a database's page, shown once it exists:
 *
 * - "Select, edit or delete entries" opens the full entries list filtered to
 *   this database. The Entries table on the page itself is Payload's join
 *   table, which can open and add entries but has no checkboxes, so selecting
 *   many at once -- to delete them, or to publish them together -- happens
 *   there.
 * - "Download as spreadsheet" exports every entry, drafts included, as an
 *   .xlsx in the same format the spreadsheet import reads -- see
 *   exportBibliography in src/lib/bibliographyImport.ts and the endpoint on
 *   Databases (src/collections/Information.ts).
 */
export default function DatabaseActions() {
  const { id } = useDocumentInfo()
  if (!id) return null
  const filter = `where[or][0][and][0][database][equals]=${encodeURIComponent(String(id))}`
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'calc(var(--base) / 2)',
        marginBottom: 'var(--base)',
      }}
    >
      <Button
        buttonStyle="secondary"
        el="link"
        url={`/admin/collections/bibliography-entries?${filter}`}
      >
        Select, edit or delete entries
      </Button>
      <Button buttonStyle="secondary" el="anchor" url={`/api/databases/${id}/export`}>
        Download as spreadsheet
      </Button>
    </div>
  )
}
