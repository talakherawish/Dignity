'use client'
import { Link, useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { sameTitle, similarTitles } from '../../lib/similarity'

/**
 * Under an entry's title, as it is typed: any entry in the same database with
 * the same or a nearly identical title -- the check the spreadsheet import
 * makes (src/lib/bibliographyImport.ts), for entries added by hand. Only a
 * warning: two sources can share a title (a book and its review, a new
 * edition), so saving stays possible.
 */

type Entry = { id: string; title?: string | null; year?: string | null }

export default function EntrySimilarNotice() {
  const { id } = useDocumentInfo()
  const title = useFormFields(([fields]) => fields.title?.value as string | undefined)
  const year = useFormFields(([fields]) => fields.year?.value as string | undefined)
  const database = useFormFields(([fields]) => fields.database?.value) as
    string | { id?: string; value?: string } | undefined
  const databaseId =
    typeof database === 'object' ? (database?.value ?? database?.id) : (database ?? undefined)
  const {
    config: {
      serverURL,
      routes: { admin, api },
    },
  } = useConfig()
  const [entries, setEntries] = useState<{ database: string; docs: Entry[] }>()

  useEffect(() => {
    if (!databaseId) return
    const query = new URLSearchParams({
      'where[database][equals]': String(databaseId),
      pagination: 'false',
      limit: '0',
      depth: '0',
      draft: 'true',
      'select[title]': 'true',
      'select[year]': 'true',
    })
    fetch(`${serverURL}${api}/bibliography-entries?${query}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setEntries({ database: String(databaseId), docs: data.docs ?? [] }))
      .catch(() => undefined)
  }, [serverURL, api, databaseId])

  const text = title?.trim()
  if (!text || !entries || entries.database !== String(databaseId)) return null
  const yearText = (year ?? '').trim()
  const matches = entries.docs
    .filter((e) => String(e.id) !== String(id) && e.title && similarTitles(e.title, text))
    .map((e) => ({
      ...e,
      duplicate: sameTitle(e.title!, text) && (e.year ?? '').trim() === yearText,
    }))
  if (!matches.length) return null
  const duplicate = matches.some((m) => m.duplicate)

  return (
    <div
      style={{
        marginBottom: 'var(--base)',
        padding: 'calc(var(--base) / 2) calc(var(--base) * 0.75)',
        border: `1px solid var(--theme-${duplicate ? 'error' : 'warning'}-500)`,
        borderRadius: 'var(--style-radius-s)',
        background: `var(--theme-${duplicate ? 'error' : 'warning'}-50)`,
      }}
    >
      <strong>
        {duplicate
          ? 'This entry looks like it is already in this database:'
          : 'Similar entries already in this database:'}
      </strong>
      <ul style={{ margin: 'calc(var(--base) / 4) 0', paddingInlineStart: 'var(--base)' }}>
        {matches.map((m) => (
          <li key={m.id}>
            <Link href={`${admin}/collections/bibliography-entries/${m.id}`}>{m.title}</Link>
            {m.year ? ` (${m.year})` : ''}
            {m.duplicate ? ' -- same title and year' : ''}
          </li>
        ))}
      </ul>
      Check whether it is the same source before saving. If it is a different one that happens to
      share a title, carry on.
    </div>
  )
}
