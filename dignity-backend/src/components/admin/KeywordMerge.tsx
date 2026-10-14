'use client'
import { Button, toast, useConfig, useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { similarKeywords } from '../../lib/similarity'
import { keywordLabel, mergeKeyword, useKeywords } from './useKeywords'

/**
 * At the bottom of a saved keyword: merge it into another keyword (see
 * src/lib/mergeKeywords.ts). Keywords spelled similarly are listed first.
 * Afterwards the editor lands on the keyword that was kept.
 */
export default function KeywordMerge() {
  const { id, initialData } = useDocumentInfo()
  const keywords = useKeywords()
  const router = useRouter()
  const {
    config: {
      serverURL,
      routes: { admin, api },
    },
  } = useConfig()
  const [into, setInto] = useState('')
  const [merging, setMerging] = useState(false)

  const self = useMemo(() => keywords?.find((k) => String(k.id) === String(id)), [keywords, id])
  const options = useMemo(() => {
    if (!keywords || !self) return []
    const close = (k: (typeof keywords)[number]) =>
      Boolean(
        (self.name && k.name && similarKeywords(self.name, k.name)) ||
        (self.nameAr && k.nameAr && similarKeywords(self.nameAr, k.nameAr)),
      )
    return keywords
      .filter((k) => String(k.id) !== String(id))
      .map((k) => ({ k, close: close(k) }))
      .sort(
        (a, b) =>
          Number(b.close) - Number(a.close) || keywordLabel(a.k).localeCompare(keywordLabel(b.k)),
      )
  }, [keywords, self, id])

  if (!id || !initialData) return null

  async function merge() {
    const target = options.find((o) => String(o.k.id) === into)?.k
    if (!self || !target) return
    setMerging(true)
    try {
      if (await mergeKeyword(`${serverURL}${api}`, self, target)) {
        toast.success(`Merged into "${keywordLabel(target)}".`)
        router.push(`${admin}/collections/keywords/${target.id}`)
        return
      }
    } catch (error) {
      toast.error((error as Error).message)
    }
    setMerging(false)
  }

  return (
    <div
      style={{
        marginTop: 'calc(var(--base) * 2)',
        paddingTop: 'var(--base)',
        borderTop: '1px solid var(--theme-elevation-100)',
      }}
    >
      <h4 style={{ margin: 0 }}>Merge into another keyword</h4>
      <p
        style={{
          margin: 'calc(var(--base) / 4) 0 calc(var(--base) / 2)',
          color: 'var(--theme-elevation-500)',
        }}
      >
        If this keyword means the same as another one, merge it: its entries and readings move to
        the other keyword, and this one is deleted.
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'calc(var(--base) / 2)',
          alignItems: 'center',
        }}
      >
        <select
          value={into}
          onChange={(e) => setInto(e.target.value)}
          disabled={!keywords || merging}
          style={{
            minWidth: '16rem',
            padding: 'calc(var(--base) / 3) calc(var(--base) / 2)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-elevation-800)',
            font: 'inherit',
          }}
        >
          <option value="">{keywords ? 'Choose the keyword to keep…' : 'Loading keywords…'}</option>
          {options.map(({ k, close }) => (
            <option key={k.id} value={String(k.id)}>
              {close ? '≈ ' : ''}
              {keywordLabel(k)}
            </option>
          ))}
        </select>
        <Button buttonStyle="secondary" margin={false} disabled={!into || merging} onClick={merge}>
          {merging ? 'Merging…' : 'Merge'}
        </Button>
      </div>
    </div>
  )
}
