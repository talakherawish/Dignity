'use client'
import { useConfig } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export type KeywordDoc = { id: string; name?: string | null; nameAr?: string | null }

export const keywordLabel = (k: KeywordDoc) => [k.name, k.nameAr].filter(Boolean).join(' / ')

/**
 * Merges keyword `from` into `into` through POST /api/keywords/:id/merge
 * (src/lib/mergeKeywords.ts), after the editor confirms. Resolves to true once
 * merged, false if cancelled; throws with the server's message on failure.
 */
export async function mergeKeyword(apiURL: string, from: KeywordDoc, into: KeywordDoc) {
  const ok = window.confirm(
    `Merge "${keywordLabel(from)}" into "${keywordLabel(into)}"?\n\n` +
      `Every entry and reading tagged "${keywordLabel(from)}" will be tagged "${keywordLabel(into)}" instead, ` +
      `and "${keywordLabel(from)}" will be deleted. This cannot be undone.`,
  )
  if (!ok) return false
  const res = await fetch(`${apiURL}/keywords/${from.id}/merge`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ into: into.id }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'The merge failed.')
  return true
}

/**
 * Every keyword, fetched once -- for the near-duplicate checks in
 * KeywordSimilarNotice and KeywordDuplicatesPanel, which compare in the
 * browser (a few hundred short names).
 */
export function useKeywords(): KeywordDoc[] | undefined {
  const {
    config: {
      serverURL,
      routes: { api },
    },
  } = useConfig()
  const [keywords, setKeywords] = useState<KeywordDoc[]>()
  useEffect(() => {
    fetch(`${serverURL}${api}/keywords?pagination=false&limit=0&depth=0`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => setKeywords(data.docs ?? []))
      .catch(() => setKeywords([]))
  }, [serverURL, api])
  return keywords
}
