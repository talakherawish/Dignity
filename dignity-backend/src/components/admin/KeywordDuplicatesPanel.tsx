'use client'
import { Gutter, Link, useConfig } from '@payloadcms/ui'
import { useMemo } from 'react'
import { similarKeywords } from '../../lib/similarity'
import { useKeywords, type KeywordDoc } from './useKeywords'

/**
 * Above the Keywords list: every pair of keywords spelled nearly the same --
 * a typo, a plural, a hyphen, ة for ه -- whether typed in by hand or brought
 * in by a spreadsheet import. Each pair links to both keywords so an editor
 * can decide whether they are one word, and if so retag its entries and
 * delete the other.
 */
export default function KeywordDuplicatesPanel() {
  const keywords = useKeywords()
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()

  const pairs = useMemo(() => {
    const list = keywords ?? []
    const found: [KeywordDoc, KeywordDoc][] = []
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [a, b] = [list[i], list[j]]
        if (
          (a.name && b.name && similarKeywords(a.name, b.name)) ||
          (a.nameAr && b.nameAr && similarKeywords(a.nameAr, b.nameAr))
        ) {
          found.push([a, b])
        }
      }
    }
    return found
  }, [keywords])

  if (!keywords || !pairs.length) return null

  const label = (k: KeywordDoc) => (
    <Link href={`${admin}/collections/keywords/${k.id}`}>
      {[k.name, k.nameAr].filter(Boolean).join(' / ')}
    </Link>
  )

  return (
    <Gutter>
      <details
        style={{
          margin: 'var(--base) 0',
          padding: 'calc(var(--base) / 2) calc(var(--base) * 0.75)',
          border: '1px solid var(--theme-warning-500)',
          borderRadius: 'var(--style-radius-s)',
          background: 'var(--theme-warning-50)',
        }}
      >
        <summary style={{ cursor: 'pointer' }}>
          <strong>
            {pairs.length} {pairs.length === 1 ? 'pair' : 'pairs'} of similar keywords
          </strong>{' '}
          -- check whether each is really one word
        </summary>
        <p style={{ margin: 'calc(var(--base) / 2) 0' }}>
          If two mean the same thing, move the entries tagged with one onto the other, then delete
          the one no longer used. If they are genuinely different words, leave them.
        </p>
        <ul style={{ margin: 0, paddingInlineStart: 'var(--base)' }}>
          {pairs.map(([a, b]) => (
            <li key={`${a.id}-${b.id}`}>
              {label(a)} ≈ {label(b)}
            </li>
          ))}
        </ul>
      </details>
    </Gutter>
  )
}
