/**
 * Payload CMS API client
 * Fetches published content from the Payload backend.
 * Falls back gracefully (returns []) if the backend is unreachable.
 */

const PAYLOAD_URL = (import.meta.env.VITE_PAYLOAD_URL as string | undefined) ?? 'http://localhost:3000'

export { PAYLOAD_URL }

// ── Types ──────────────────────────────────────────────────────────────────

export type PayloadMedia = {
  url: string
  alt?: string
}

export type PayloadArticle = {
  id: string
  title: string
  titleAr?: string
  date: string
  excerpt?: string
  excerptAr?: string
  content?: unknown
  contentAr?: unknown
  image?: PayloadMedia
}

export type PayloadActivity = {
  id: string
  title: string
  titleAr?: string
  type: 'seminar' | 'conference' | 'meeting' | 'windsor-birzeit'
  date: string
  description?: unknown
  descriptionAr?: unknown
  image?: PayloadMedia
}

export type PayloadMediaUpdate = {
  id: string
  title: string
  titleAr?: string
  type: 'news' | 'announcement' | 'photo' | 'clipping'
  date: string
  content?: unknown
  contentAr?: unknown
  image?: PayloadMedia
}

export type PayloadParticipant = {
  id: string
  name: string
  nameAr?: string
  title?: string
  titleAr?: string
  category: 'faculty' | 'researcher' | 'intern' | 'student' | 'visitor'
  email?: string
  bio?: string
  bioAr?: string
  photo?: PayloadMedia
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Extract paragraph strings from a Payload Lexical richText JSON object. */
export function extractText(lexical: unknown): string[] {
  if (!lexical || typeof lexical !== 'object') return []
  const root = (lexical as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root) return []

  const paragraphs: string[] = []

  function walk(node: Record<string, unknown>): string {
    if (node.type === 'text') return (node.text as string) ?? ''
    const children = node.children as Record<string, unknown>[] | undefined
    if (children) {
      const text = children.map(walk).join('')
      if (node.type === 'paragraph' && text.trim()) {
        paragraphs.push(text)
        return ''
      }
      return text
    }
    return ''
  }

  const children = (root as Record<string, unknown>).children as Record<string, unknown>[] | undefined
  if (children) children.forEach(walk)

  return paragraphs
}

/** Format an ISO date string for display. */
export function formatDate(iso: string, locale: 'en' | 'ar'): string {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    if (locale === 'ar') {
      return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

/** Resolve a media URL to an absolute URL. */
export function mediaUrl(media: PayloadMedia | undefined): string {
  if (!media?.url) return ''
  if (media.url.startsWith('http')) return media.url
  return `${PAYLOAD_URL}${media.url}`
}

// ── Core fetch ─────────────────────────────────────────────────────────────

async function fetchCollection<T>(
  slug: string,
  extra: Record<string, string> = {},
): Promise<T[]> {
  try {
    const params = new URLSearchParams({ depth: '1', limit: '100', ...extra })
    const res = await fetch(`${PAYLOAD_URL}/api/${slug}?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return []
    const data = (await res.json()) as { docs?: T[] }
    return data.docs ?? []
  } catch {
    return []
  }
}

// ── Public fetch functions ─────────────────────────────────────────────────

export const fetchArticles = () =>
  fetchCollection<PayloadArticle>('articles')

export const fetchActivitiesByType = (type: PayloadActivity['type']) =>
  fetchCollection<PayloadActivity>('activities', { 'where[type][equals]': type })

export const fetchMediaUpdatesByType = (type: PayloadMediaUpdate['type']) =>
  fetchCollection<PayloadMediaUpdate>('media-updates', { 'where[type][equals]': type })

export const fetchParticipants = () =>
  fetchCollection<PayloadParticipant>('participants')
