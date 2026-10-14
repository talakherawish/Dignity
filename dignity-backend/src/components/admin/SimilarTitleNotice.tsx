'use client'
import { Link, useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { sameTitle, similarTitles } from '../../lib/similarity'

/**
 * Under an item's title, as it is typed: any item in the same subject with the
 * same or a nearly identical title -- the check the spreadsheet imports make
 * (src/lib/bibliographyImport.ts, src/lib/readingsImport.ts), for items added
 * by hand. Used by bibliography entries (subject field `database`) and
 * readings (`subject`), set as clientProps in each config. Only a warning:
 * two sources can share a title (a book and its review, a new edition), so
 * saving stays possible.
 */

type Item = { id: string; title?: string | null; year?: string | null }

export default function SimilarTitleNotice({
  field,
  item,
  subject,
}: {
  /** The field tying an item to its subject. */
  field: string
  /** What an item is called, e.g. 'entry'. */
  item: string
  /** What a subject is called, e.g. 'database'. */
  subject: string
}) {
  const { id, collectionSlug } = useDocumentInfo()
  const title = useFormFields(([fields]) => fields.title?.value as string | undefined)
  const year = useFormFields(([fields]) => fields.year?.value as string | undefined)
  const parent = useFormFields(([fields]) => fields[field]?.value) as
    string | { id?: string; value?: string } | undefined
  const parentId =
    typeof parent === 'object' ? (parent?.value ?? parent?.id) : (parent ?? undefined)
  const {
    config: {
      serverURL,
      routes: { admin, api },
    },
  } = useConfig()
  const [items, setItems] = useState<{ parent: string; docs: Item[] }>()

  useEffect(() => {
    if (!parentId || !collectionSlug) return
    const query = new URLSearchParams({
      [`where[${field}][equals]`]: String(parentId),
      pagination: 'false',
      limit: '0',
      depth: '0',
      draft: 'true',
      'select[title]': 'true',
      'select[year]': 'true',
    })
    fetch(`${serverURL}${api}/${collectionSlug}?${query}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setItems({ parent: String(parentId), docs: data.docs ?? [] }))
      .catch(() => undefined)
  }, [serverURL, api, collectionSlug, field, parentId])

  const text = title?.trim()
  if (!text || !items || items.parent !== String(parentId)) return null
  const yearText = (year ?? '').trim()
  const matches = items.docs
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
          ? `This ${item} looks like it is already in this ${subject}:`
          : `Similar titles already in this ${subject}:`}
      </strong>
      <ul style={{ margin: 'calc(var(--base) / 4) 0', paddingInlineStart: 'var(--base)' }}>
        {matches.map((m) => (
          <li key={m.id}>
            <Link href={`${admin}/collections/${collectionSlug}/${m.id}`}>{m.title}</Link>
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
