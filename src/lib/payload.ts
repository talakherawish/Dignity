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

export type PayloadNews = {
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
  /** External destination for items that aren't uploads — a YouTube video, say. */
  link?: string
}

/** The video id inside a YouTube watch/embed/short/youtu.be URL. */
function youtubeId(url: string | undefined): string | undefined {
  if (!url) return undefined
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  )
  return match?.[1]
}

/**
 * Poster image for a YouTube URL, derived from the video id.
 *
 * Audiovisual items are links rather than uploads, so they have no file to
 * rasterise a preview from and would otherwise render as a bare document icon.
 *
 * `maxresdefault` is deliberate: YouTube's `hqdefault` is a 4:3 canvas with the
 * 16:9 frame letterboxed inside it, so cards built from it carry black bars
 * along the top and bottom. The `maxres`/`mq` variants are the true frame with
 * no padding. `maxresdefault` is absent for videos never uploaded in HD, hence
 * the fallback below.
 */
export function youtubeThumbnail(url: string | undefined): string {
  const id = youtubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : ''
}

/** Always-present, letterbox-free fallback for when `maxresdefault` 404s. */
export function youtubeThumbnailFallback(url: string | undefined): string {
  const id = youtubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : ''
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

/**
 * Extract paragraph strings from a Payload field that holds prose.
 *
 * Collections are not consistent about how they store it: the page/news
 * bodies are Lexical richText, while the per-activity collections
 * (seminars, conferences, meetings, research, windsor-dignity) declare
 * `description` as a plain textarea. Callers render both through this, and a
 * string used to fall straight through the `typeof !== 'object'` guard and
 * return `[]` — which is why a seminar with a full write-up displayed as a
 * bare headline. Handle both shapes, splitting plain text on blank lines the
 * way the textarea presents it.
 */
export function extractText(lexical: unknown): string[] {
  if (typeof lexical === 'string') {
    return lexical
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
  }
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

export const fetchNews = () =>
  fetchCollection<PayloadNews>('news')

// Activities — separated into individual collections
export const fetchSeminars = () =>
  fetchCollection<PayloadActivity>('seminars')

export const fetchConferences = () =>
  fetchCollection<PayloadActivity>('conferences')

export const fetchMeetings = () =>
  fetchCollection<PayloadActivity>('meetings')

export const fetchResearch = () =>
  fetchCollection<PayloadActivity>('research')

export const fetchWindsorDignity = () =>
  fetchCollection<PayloadActivity>('windsor-dignity')

// Legacy function — kept for compatibility, falls back to old activities collection if needed
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

// Publications — fetch from unified publications-items collection
export const fetchPublicationsByType = (type: PayloadPublication['type']) =>
  // depth: 2 so item.image.thumbnail (the auto-generated PDF preview) resolves
  // to a full Media object, not just an id string.
  fetchCollection<PayloadPublication>('publications-items', { 'where[type][equals]': type, depth: '2' })

// Convenience functions for each publication type
export const fetchBooks = () => fetchPublicationsByType('books')
export const fetchPapers = () => fetchPublicationsByType('papers')
export const fetchReports = () => fetchPublicationsByType('reports')
export const fetchBrochures = () => fetchPublicationsByType('brochures')
export const fetchTheses = () => fetchPublicationsByType('theses')
export const fetchAudiovisual = () => fetchPublicationsByType('audiovisual')
export const fetchPosters = () => fetchPublicationsByType('posters')

export const fetchInformationByType = (type: PayloadInformationItem['type']) =>
  fetchCollection<PayloadInformationItem>('information', { 'where[type][equals]': type })


/**
 * Fetch the editable text for a single page (e.g. "about", "mission").
 * Returns null if missing/unreachable, so callers fall back to their own copy.
 *
 * Each page is a Payload global rather than a row in a `pages` collection, so
 * that it appears in the admin sidebar under the same grouping the site's own
 * navigation uses. Globals share a slug namespace with collections and several
 * pages are named after one ("news", "participants", …), so they are stored
 * under a `page-` prefix — applied here, keeping callers on the plain key.
 */
export async function fetchPage(slug: string): Promise<PayloadPage | null> {
    try {
          const res = await fetch(`${PAYLOAD_URL}/api/globals/page-${slug}?depth=0`, {
                  headers: { 'Content-Type': 'application/json' },
          })
          if (!res.ok) return null
          return (await res.json()) as PayloadPage
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
