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
  mimeType?: string
  filename?: string
  thumbnail?: PayloadMedia
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

export type PayloadAnnouncement = {
  id: string
  title: string
  titleAr?: string
  date: string
  content?: unknown
  contentAr?: unknown
  image?: PayloadMedia
}

export type PayloadPhoto = {
  id: string
  title: string
  titleAr?: string
  date: string
  image: PayloadMedia
}

export type PayloadClipping = {
  id: string
  title: string
  titleAr?: string
  date: string
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

export type PayloadPublication = {
  id: string
  title: string
  titleAr?: string
  type: 'books' | 'papers' | 'reports' | 'brochures' | 'theses' | 'audiovisual' | 'posters'
  author?: string
  authorAr?: string
  date: string
  description?: unknown
  descriptionAr?: unknown
  file?: PayloadMedia
  image?: PayloadMedia
}

export type PayloadInformationItem = {
  id: string
  title: string
  titleAr?: string
  type: 'readings-documents' | 'databases'
  description?: unknown
  descriptionAr?: unknown
  link?: string
  file?: PayloadMedia
}

export type PayloadResearchActivity = {
  id: string
  title: string
  titleAr?: string
  description?: unknown
  descriptionAr?: unknown
  image?: PayloadMedia
}

  export type PayloadPage = {
      id: string
      slug: string
      title?: string
      titleAr?: string
      description?: string
      descriptionAr?: string
      body?: unknown
      bodyAr?: unknown
  }

    /** All fields on the Site Settings global -- every EN key has a matching key+Ar. */
export type PayloadSiteSettings = Record<string, string | undefined>

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

export const fetchAnnouncements = () =>
  fetchCollection<PayloadAnnouncement>('announcements')

export const fetchPhotos = () =>
  fetchCollection<PayloadPhoto>('photos')

export const fetchClippings = () =>
  // depth: 2 so item.image.thumbnail (the auto-generated PDF preview) resolves
  // to a full Media object, not just an id string.
  fetchCollection<PayloadClipping>('clippings', { depth: '2' })

export const fetchParticipants = () =>
  fetchCollection<PayloadParticipant>('participants')

export const fetchResearchActivities = () =>
  fetchCollection<PayloadResearchActivity>('research-activities')

export const fetchPublicationsByType = (type: PayloadPublication['type']) =>
  // depth: 2 so item.image.thumbnail (the auto-generated PDF preview) resolves
  // to a full Media object, not just an id string.
  fetchCollection<PayloadPublication>('publications', { 'where[type][equals]': type, depth: '2' })

export const fetchInformationByType = (type: PayloadInformationItem['type']) =>
  fetchCollection<PayloadInformationItem>('information', { 'where[type][equals]': type })


/** Fetch a single editable Page document by its slug (e.g. "about", "mission"). Returns null if missing/unreachable. */
export async function fetchPage(slug: string): Promise<PayloadPage | null> {
    try {
          const params = new URLSearchParams({ 'where[slug][equals]': slug, depth: '0', limit: '1' })
          const res = await fetch(`${PAYLOAD_URL}/api/pages?${params}`, {
                  headers: { 'Content-Type': 'application/json' },
          })
          if (!res.ok) return null
          const data = (await res.json()) as { docs?: PayloadPage[] }
          return data.docs?.[0] ?? null
    } catch {
          return null
    }
}

/** Fetch the Site Settings global (nav labels, hero, footer, small UI labels). Returns null if unreachable. */
export async function fetchSiteSettings(): Promise<PayloadSiteSettings | null> {
    try {
          const res = await fetch(`${PAYLOAD_URL}/api/globals/site-settings?depth=0`, {
                  headers: { 'Content-Type': 'application/json' },
          })
          if (!res.ok) return null
          return (await res.json()) as PayloadSiteSettings
    } catch {
          return null
    }
}



/**
 * Extract structured content from a Payload Lexical richText JSON object,
 * separating plain paragraphs from any top-level bullet/numbered list items.
 * `extractText` above silently drops list nodes entirely (a bare `<ul>` isn't
 * a `paragraph` node so its text never got pushed) — this is used wherever a
 * page's body may contain a list that should render distinctly, e.g. as a
 * card grid rather than flowing prose.
 */
export function extractBlocks(lexical: unknown): { paragraphs: string[]; items: string[] } {
    if (!lexical || typeof lexical !== 'object') return { paragraphs: [], items: [] }
        const root = (lexical as Record<string, unknown>).root as Record<string, unknown> | undefined
    if (!root) return { paragraphs: [], items: [] }

        const paragraphs: string[] = []
            const items: string[] = []

                function text(node: Record<string, unknown>): string {
                      if (node.type === 'text') return (node.text as string) ?? ''
                      const children = node.children as Record<string, unknown>[] | undefined
                      if (children) return children.map(text).join('')
                      return ''
                }

  function walkTop(node: Record<string, unknown>) {
        if (node.type === 'paragraph') {
                const t = text(node)
                if (t.trim()) paragraphs.push(t)
                return
        }
        if (node.type === 'list') {
                const listItems = (node.children as Record<string, unknown>[] | undefined) ?? []
                        for (const li of listItems) {
                                  const t = text(li)
                                  if (t.trim()) items.push(t)
                        }
                return
        }
        // Fallback: any other top-level node, just try to read its text as a paragraph.
      const t = text(node)
        if (t.trim()) paragraphs.push(t)
  }

  const children = (root as Record<string, unknown>).children as Record<string, unknown>[] | undefined
    if (children) children.forEach(walkTop)

  return { paragraphs, items }
}
