'use client'
import { Button, useDocumentInfo } from '@payloadcms/ui'

/**
 * The button at the top of a subject's Edit tab (a database, or a Readings and
 * Documents subject), shown once it exists: "Download as spreadsheet" exports
 * every item, drafts included, as an .xlsx in the same format its spreadsheet
 * import reads -- see the `/:id/export` endpoint on each subject collection
 * (src/collections/Information.ts).
 *
 * The items themselves are on the tab beside it (SubjectEntriesView).
 */
export default function SubjectActions() {
  const { id, collectionSlug } = useDocumentInfo()
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
      <Button buttonStyle="secondary" el="anchor" url={`/api/${collectionSlug}/${id}/export`}>
        Download as spreadsheet
      </Button>
    </div>
  )
}
