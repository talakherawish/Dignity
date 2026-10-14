'use client'
import { useConfig } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export type KeywordDoc = { id: string; name?: string | null; nameAr?: string | null }

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
