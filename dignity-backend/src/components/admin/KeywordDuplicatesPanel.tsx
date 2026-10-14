'use client'
import { Button, Gutter, Link, toast, useConfig } from '@payloadcms/ui'
import { useMemo, useState } from 'react'
import { similarKeywords } from '../../lib/similarity'
import { keywordLabel, mergeKeyword, useKeywords, type KeywordDoc } from './useKeywords'

/**
 * Above the Keywords list: every pair of keywords spelled nearly the same --
 * a typo, a plural, a hyphen, ة for ه -- whether typed in by hand or brought
 * in by a spreadsheet import. Each pair links to both keywords, and "Keep"
 * merges the other one into it (src/lib/mergeKeywords.ts).
 */
export default function KeywordDuplicatesPanel() {
  const keywords = useKeywords()
  const [merging, setMerging] = useState(false)
  const {
    config: {
      serverURL,
      routes: { admin, api },
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
    <Link href={`${admin}/collections/keywords/${k.id}`}>{keywordLabel(k)}</Link>
  )

  async function keep(into: KeywordDoc, from: KeywordDoc) {
    setMerging(true)
    try {
      if (await mergeKeyword(`${serverURL}${api}`, from, into)) {
        toast.success(`Merged into "${keywordLabel(into)}".`)
        // Reloaded so the list below and these pairs both lose the merged keyword.
        window.location.reload()
        return
      }
    } catch (error) {
      toast.error((error as Error).message)
    }
    setMerging(false)
  }

  const keepButton = (into: KeywordDoc, from: KeywordDoc) => (
    <Button
      buttonStyle="secondary"
      size="small"
      margin={false}
      disabled={merging}
      onClick={() => keep(into, from)}
    >
      Keep {keywordLabel(into)}
    </Button>
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
          If two mean the same thing, click Keep on the spelling to keep: the other one&apos;s
          entries and readings move to it, and the other one is deleted. If they are genuinely
          different words, leave them.
        </p>
        <ul style={{ margin: 0, paddingInlineStart: 'var(--base)' }}>
          {pairs.map(([a, b]) => (
            <li
              key={`${a.id}-${b.id}`}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 'calc(var(--base) / 2)',
                marginBottom: 'calc(var(--base) / 3)',
              }}
            >
              <span>
                {label(a)} ≈ {label(b)}
              </span>
              {keepButton(a, b)}
              {keepButton(b, a)}
            </li>
          ))}
        </ul>
      </details>
    </Gutter>
  )
}
