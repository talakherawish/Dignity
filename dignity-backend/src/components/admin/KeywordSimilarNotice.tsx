'use client'
import { Link, useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { similarKeywords } from '../../lib/similarity'
import { useKeywords } from './useKeywords'

/**
 * Under a keyword's names, as they are typed: any existing keyword spelled
 * nearly the same ("Clientalism" beside "Clientelism"). Only a warning -- the
 * form's own validation refuses an exact duplicate, but a near one may be a
 * genuinely different word, so saving stays possible.
 */
export default function KeywordSimilarNotice() {
  const { id } = useDocumentInfo()
  const name = useFormFields(([fields]) => fields.name?.value as string | undefined)
  const nameAr = useFormFields(([fields]) => fields.nameAr?.value as string | undefined)
  const keywords = useKeywords()
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()

  const matches = (keywords ?? []).filter(
    (k) =>
      String(k.id) !== String(id) &&
      ((name?.trim() && k.name && similarKeywords(k.name, name)) ||
        (nameAr?.trim() && k.nameAr && similarKeywords(k.nameAr, nameAr))),
  )
  if (!matches.length) return null

  return (
    <div
      style={{
        marginBottom: 'var(--base)',
        padding: 'calc(var(--base) / 2) calc(var(--base) * 0.75)',
        border: '1px solid var(--theme-warning-500)',
        borderRadius: 'var(--style-radius-s)',
        background: 'var(--theme-warning-50)',
      }}
    >
      <strong>Similar keywords already exist:</strong>{' '}
      {matches.map((k, i) => (
        <span key={k.id}>
          {i > 0 && ', '}
          <Link href={`${admin}/collections/keywords/${k.id}`}>
            {[k.name, k.nameAr].filter(Boolean).join(' / ')}
          </Link>
        </span>
      ))}
      . If one of them means the same thing, use it instead -- every keyword becomes its own filter
      on the website.
    </div>
  )
}
