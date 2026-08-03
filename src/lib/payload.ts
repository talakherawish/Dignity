/**
 * Payload CMS API client
 * Fetches published content from the Payload backend.
 * Falls back gracefully (returns []) if the backend is unreachable.
 */

const PAYLOAD_URL =
  (import.meta.env.VITE_PAYLOAD_URL as string | undefined) ?? "http://localhost:3000";

export { PAYLOAD_URL };

// ── Types ──────────────────────────────────────────────────────────────────

export type PayloadMedia = {
  url: string;
  alt?: string;
  mimeType?: string;
  filename?: string;
  thumbnail?: PayloadMedia;
};

export type PayloadNews = {
  id: string;
  title: string;
  titleAr?: string;
  date: string;
  excerpt?: string;
  excerptAr?: string;
  content?: unknown;
  contentAr?: unknown;
  image?: PayloadMedia;
};

export type PayloadActivity = {
  id: string;
  title: string;
  titleAr?: string;
  type: "seminar" | "conference" | "meeting" | "windsor-birzeit";
  date: string;
  description?: unknown;
  descriptionAr?: unknown;
  image?: PayloadMedia;
};

export type PayloadAnnouncement = {
  id: string;
  title: string;
  titleAr?: string;
  date: string;
  content?: unknown;
  contentAr?: unknown;
  image?: PayloadMedia;
};

export type PayloadPhoto = {
  id: string;
  title: string;
  titleAr?: string;
  date: string;
  image: PayloadMedia;
};

export type PayloadClipping = {
  id: string;
  title: string;
  titleAr?: string;
  date: string;
  image?: PayloadMedia;
};

export type PayloadParticipant = {
  id: string;
  name: string;
  nameAr?: string;
  title?: string;
  titleAr?: string;
  category: "faculty" | "researcher" | "intern" | "student" | "visitor";
  email?: string;
  bio?: string;
  bioAr?: string;
  photo?: PayloadMedia;
};

export type PayloadPublication = {
  id: string;
  title: string;
  titleAr?: string;
  type: "books" | "papers" | "reports" | "brochures" | "theses" | "audiovisual" | "posters";
  author?: string;
  authorAr?: string;
  date: string;
  description?: unknown;
  descriptionAr?: unknown;
  file?: PayloadMedia;
  image?: PayloadMedia;
  /** External destination for items that aren't uploads — a YouTube video, say. */
  link?: string;
};

/** The video id inside a YouTube watch/embed/short/youtu.be URL. */
function youtubeId(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match?.[1];
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
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : "";
}

/** Always-present, letterbox-free fallback for when `maxresdefault` 404s. */
export function youtubeThumbnailFallback(url: string | undefined): string {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : "";
}

export type PayloadInformationItem = {
  id: string;
  title: string;
  titleAr?: string;
  type: "readings-documents" | "databases";
  description?: unknown;
  descriptionAr?: unknown;
  link?: string;
  file?: PayloadMedia;
};

export type PayloadResearchActivity = {
  id: string;
  /** End of the entry's URL, generated from the English title in the admin. */
  slug?: string;
  title: string;
  titleAr?: string;
  description?: unknown;
  descriptionAr?: unknown;
  content?: unknown;
  contentAr?: unknown;
  image?: PayloadMedia;
  /** Outputs attached to this research area in the admin - organized by type. */
  relatedBooks?: PayloadPublication[];
  relatedPapers?: PayloadPublication[];
  relatedReports?: PayloadPublication[];
  relatedBrochures?: PayloadPublication[];
  relatedTheses?: PayloadPublication[];
  relatedAudiovisual?: PayloadPublication[];
  relatedPosters?: PayloadPublication[];
  relatedClippings?: PayloadClipping[];
  relatedPhotos?: PayloadPhoto[];
};

/** All fields on the Site Settings global -- every EN key has a matching key+Ar. */
export type PayloadSiteSettings = Record<string, string | undefined>;

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
  if (typeof lexical === "string") {
    return lexical
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  if (!lexical || typeof lexical !== "object") return [];
  const root = (lexical as Record<string, unknown>).root as Record<string, unknown> | undefined;
  if (!root) return [];

  const paragraphs: string[] = [];

  function walk(node: Record<string, unknown>): string {
    if (node.type === "text") return (node.text as string) ?? "";
    const children = node.children as Record<string, unknown>[] | undefined;
    if (children) {
      const text = children.map(walk).join("");
      if (node.type === "paragraph" && text.trim()) {
        paragraphs.push(text);
        return "";
      }
      return text;
    }
    return "";
  }

  const children = (root as Record<string, unknown>).children as
    Record<string, unknown>[] | undefined;
  if (children) children.forEach(walk);

  return paragraphs;
}

/** Format an ISO date string for display. */
export function formatDate(iso: string, locale: "en" | "ar"): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (locale === "ar") {
      return date.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
    }
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

/** Resolve a media URL to an absolute URL. */
export function mediaUrl(media: PayloadMedia | undefined): string {
  if (!media?.url) return "";
  if (media.url.startsWith("http")) return media.url;
  return `${PAYLOAD_URL}${media.url}`;
}

// ── Core fetch ─────────────────────────────────────────────────────────────

async function fetchCollection<T>(slug: string, extra: Record<string, string> = {}): Promise<T[]> {
  try {
    const params = new URLSearchParams({ depth: "1", limit: "100", ...extra });
    const res = await fetch(`${PAYLOAD_URL}/api/${slug}?${params}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { docs?: T[] };
    return data.docs ?? [];
  } catch {
    return [];
  }
}

// ── Public fetch functions ─────────────────────────────────────────────────

/**
 * Newest first, by the entry's own date field.
 *
 * Without this Payload falls back to its own default ordering, which keyed off
 * createdAt — so a feed showed whatever was typed into the admin most recently
 * rather than the most recent entry, and the visible dates came out scrambled
 * (the news list ran 2022, 2022, 2023 top to bottom). Every collection with a
 * date field is ordered this way so the homepage feeds and the listing pages
 * agree with each other.
 */
const NEWEST_FIRST = { sort: "-date" };

export const fetchNews = () => fetchCollection<PayloadNews>("news", NEWEST_FIRST);

// Activities — separated into individual collections
export const fetchSeminars = () => fetchCollection<PayloadActivity>("seminars", NEWEST_FIRST);

export const fetchConferences = () => fetchCollection<PayloadActivity>("conferences", NEWEST_FIRST);

export const fetchMeetings = () => fetchCollection<PayloadActivity>("meetings", NEWEST_FIRST);

/**
 * Research areas, shown under Activities → Research.
 *
 * depth: 2 so the attached publications, clippings and photos arrive as whole
 * documents (with their own uploads resolved) rather than bare ids.
 */
export const fetchResearch = () =>
  fetchCollection<PayloadResearchActivity>("research", { depth: "2" });

/** One research area by its slug, for its own page. Undefined if no match. */
export async function fetchResearchBySlug(
  slug: string,
): Promise<PayloadResearchActivity | undefined> {
  const docs = await fetchCollection<PayloadResearchActivity>("research", {
    "where[slug][equals]": slug,
    depth: "2",
    limit: "1",
  });
  return docs[0];
}

export const fetchWindsorDignity = () =>
  fetchCollection<PayloadActivity>("windsor-dignity", NEWEST_FIRST);

export const fetchAnnouncements = () =>
  fetchCollection<PayloadAnnouncement>("announcements", NEWEST_FIRST);

export const fetchPhotos = () => fetchCollection<PayloadPhoto>("photos", NEWEST_FIRST);

export const fetchClippings = () =>
  // depth: 2 so item.image.thumbnail (the auto-generated PDF preview) resolves
  // to a full Media object, not just an id string.
  fetchCollection<PayloadClipping>("clippings", { depth: "2", ...NEWEST_FIRST });

// Participants carry no date — Payload's own ordering is what the admin sees.
export const fetchParticipants = () => fetchCollection<PayloadParticipant>("participants");

// Publications — fetch from unified publications-items collection
export const fetchPublicationsByType = (type: PayloadPublication["type"]) =>
  // depth: 2 so item.image.thumbnail (the auto-generated PDF preview) resolves
  // to a full Media object, not just an id string.
  fetchCollection<PayloadPublication>("publications-items", {
    "where[type][equals]": type,
    depth: "2",
    ...NEWEST_FIRST,
  });

// Convenience functions for each publication type
export const fetchBooks = () => fetchPublicationsByType("books");
export const fetchPapers = () => fetchPublicationsByType("papers");
export const fetchReports = () => fetchPublicationsByType("reports");
export const fetchBrochures = () => fetchPublicationsByType("brochures");
export const fetchTheses = () => fetchPublicationsByType("theses");
export const fetchAudiovisual = () => fetchPublicationsByType("audiovisual");
export const fetchPosters = () => fetchPublicationsByType("posters");

export const fetchInformationByType = (type: PayloadInformationItem["type"]) =>
  fetchCollection<PayloadInformationItem>("information", { "where[type][equals]": type });

/** Fetch the Site Settings global (nav labels, hero, footer, small UI labels). Returns null if unreachable. */
export async function fetchSiteSettings(): Promise<PayloadSiteSettings | null> {
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/globals/site-settings?depth=0`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as PayloadSiteSettings;
  } catch {
    return null;
  }
}
