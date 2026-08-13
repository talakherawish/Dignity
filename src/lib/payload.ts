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
  /** Used to bust the CDN cache when a file is re-cropped -- see mediaUrl. */
  updatedAt?: string;
  alt?: string;
  mimeType?: string;
  filename?: string;
  /**
   * Pixel dimensions Payload records for every image upload. The photo gallery
   * lays rows out from these, so it knows each picture's proportions before it
   * has loaded and never has to guess at a box to crop into.
   */
  width?: number;
  height?: number;
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

export type PayloadGalleryItem = {
  id?: string;
  image?: PayloadMedia;
  caption?: string;
  captionAr?: string;
};

export type PayloadActivity = {
  id: string;
  title: string;
  titleAr?: string;
  type: "seminar" | "conference" | "meeting" | "windsor-birzeit";
  date: string;
  /** Meetings only, and optional even there: a round table or a discussion. */
  kind?: "roundtable" | "discussion";
  description?: unknown;
  descriptionAr?: unknown;
  content?: unknown;
  contentAr?: unknown;
  image?: PayloadMedia;
  gallery?: PayloadGalleryItem[];
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
  /** Both optional: a photo that speaks for itself needs no caption or date. */
  title?: string;
  titleAr?: string;
  date?: string;
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

/**
 * The seven publication collections, one per entry under Publications in the
 * site's menu. Each is its own Payload collection — they were a single
 * collection with a `type` field until the CMS was rearranged to mirror the
 * navigation — so the value doubles as the API endpoint to read from.
 */
export type PublicationCollection =
  "books" | "papers" | "reports" | "brochures" | "theses" | "audiovisual" | "posters";

export type PayloadPublication = {
  id: string;
  title: string;
  titleAr?: string;
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

/** Same again for the Information menu: one collection per page. */
export type InformationCollection = "readings-documents" | "databases";

export type PayloadInformationItem = {
  id: string;
  title: string;
  titleAr?: string;
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
  /**
   * Outputs attached to this research area in the admin - organized by type.
   *
   * Payload returns a relationship as the whole document when it can resolve
   * it and as a bare id string when it cannot — which happens when the target
   * was deleted while still selected here. The `| string` is not theoretical:
   * "Protecting Workers Dignity" currently holds one brochure id whose
   * document no longer exists. Read these through `populated()` rather than
   * indexing into them directly.
   */
  relatedBooks?: (PayloadPublication | string)[];
  relatedPapers?: (PayloadPublication | string)[];
  relatedReports?: (PayloadPublication | string)[];
  relatedBrochures?: (PayloadPublication | string)[];
  relatedTheses?: (PayloadPublication | string)[];
  relatedAudiovisual?: (PayloadPublication | string)[];
  relatedPosters?: (PayloadPublication | string)[];
  relatedClippings?: (PayloadClipping | string)[];
  relatedPhotos?: (PayloadPhoto | string)[];
};

/**
 * The documents in a relationship field, with unresolved ids dropped.
 *
 * Payload leaves a relationship as a bare id string when the document behind
 * it is gone, so a caller that trusts the array shape renders an empty card
 * (or throws) for every dangling reference. Everything reading a `related*`
 * field goes through here, which also keeps the counts on the research index
 * honest — they used to include ids that the detail page could not display.
 */
export function populated<T>(items: (T | string)[] | undefined): T[] {
  if (!items) return [];
  return items.filter((item): item is T => typeof item === "object" && item !== null);
}

/** A standalone page — its heading, its intro line, and its prose. */
export type PayloadPage = {
  id: string;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  body?: unknown;
  bodyAr?: unknown;
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

/**
 * True when a prose field holds something worth rendering.
 *
 * Callers fall back from a full write-up to a short description, so they need
 * to know whether the first one is empty before choosing. Handles both shapes
 * the CMS produces — Lexical richText and a plain textarea string — for the
 * same reason `extractText` does.
 */
export function hasProse(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (!value || typeof value !== "object") return false;
  const root = (value as Record<string, unknown>).root as Record<string, unknown> | undefined;
  const children = root?.children;
  if (!Array.isArray(children) || children.length === 0) return false;
  return JSON.stringify(children).includes('"text"');
}

/**
 * The bullet points in a Lexical field, as plain strings.
 *
 * `extractText` above deliberately returns paragraphs only, so a list — the
 * "avenues" the initiative works through, on the About page — comes back
 * empty from it. Pages that render a list separately from their prose read it
 * through here.
 */
export function extractListItems(lexical: unknown): string[] {
  if (!lexical || typeof lexical !== "object") return [];
  const root = (lexical as Record<string, unknown>).root as Record<string, unknown> | undefined;
  if (!root) return [];

  const items: string[] = [];

  function textOf(node: Record<string, unknown>): string {
    if (node.type === "text") return (node.text as string) ?? "";
    const children = node.children as Record<string, unknown>[] | undefined;
    return children ? children.map(textOf).join("") : "";
  }

  function walk(node: Record<string, unknown>): void {
    if (node.type === "listitem") {
      const text = textOf(node).trim();
      if (text) items.push(text);
      return;
    }
    const children = node.children as Record<string, unknown>[] | undefined;
    if (children) children.forEach(walk);
  }

  walk(root);
  return items;
}

/**
 * Format an ISO date string for display.
 *
 * `numberingSystem: "latn"` on the Arabic branch: ar-EG's default digit
 * shapes are Arabic-Indic (١٢٣٤), which the client asked to have replaced
 * with the Western digits (1234) already used everywhere else on the site.
 * The Arabic month name is untouched — only the numeral shapes change.
 */
export function formatDate(iso: string, locale: "en" | "ar"): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (locale === "ar") {
      return date.toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
        numberingSystem: "latn",
      });
    }
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

/** Resolve a media URL to an absolute URL. */
/**
 * The public URL for an upload, with the record's own timestamp on the end.
 *
 * Uploads are served from raw.githubusercontent.com, which sends
 * Cache-Control: max-age=300 -- and cropping an image in the admin rewrites
 * the file under the same name. Same URL, cached bytes: the crop appeared to
 * do nothing. The timestamp changes whenever the record does, so a cropped or
 * replaced file arrives as a URL nothing has cached yet.
 */
export function mediaUrl(media: PayloadMedia | undefined): string {
  if (!media?.url) return "";
  const base = media.url.startsWith("http") ? media.url : `${PAYLOAD_URL}${media.url}`;
  if (!media.updatedAt) return base;
  const version = Date.parse(media.updatedAt);
  if (Number.isNaN(version)) return base;
  return `${base}${base.includes("?") ? "&" : "?"}v=${version}`;
}

/**
 * Opens an uploaded file in a new tab so it previews instead of downloading.
 *
 * Uploads are served straight from raw.githubusercontent.com (see mediaUrl
 * above), which is a GitHub security measure this project's own server has
 * no control over: it answers PDF requests with `Content-Type:
 * application/octet-stream` plus `X-Content-Type-Options: nosniff` no matter
 * what the file actually is, which forces a download no matter how the link
 * to it is written. Fetching the bytes ourselves and re-wrapping them in a
 * Blob carrying the *real* mime type (already known from what Payload
 * recorded at upload time) gives the browser what it needs to render the
 * file inline instead.
 *
 * The tab has to be opened synchronously, before the fetch, or popup
 * blockers treat it as an unrequested popup; its location is filled in once
 * the blob is ready. `tab.opener` is cleared for the same reason a manual
 * `rel="noopener"` would be: the new tab still shows attacker-uploadable
 * content, so it shouldn't keep a handle back to this page.
 */
export function openFileInNewTab(url: string, mimeType?: string): void {
  if (!url) return;
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Fetching file returned ${res.status}`);
      return res.blob();
    })
    .then((rawBlob) => {
      const blob = mimeType ? new Blob([rawBlob], { type: mimeType }) : rawBlob;
      if (tab) tab.location.href = URL.createObjectURL(blob);
    })
    .catch(() => {
      // Falls back to the raw (possibly downloading) URL rather than leaving
      // the visitor staring at a blank tab.
      if (tab) tab.location.href = url;
    });
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

/**
 * Meetings, newest first.
 *
 * depth 2 rather than the shared default of 1: a meeting's extra images are
 * uploads nested inside the `gallery` array, a hop further in than the
 * featured image, so they need the extra level to arrive as media objects
 * with a url rather than as bare ids.
 */
export const fetchMeetings = () =>
  fetchCollection<PayloadActivity>("meetings", { ...NEWEST_FIRST, depth: "2" });

/**
 * Research areas, shown under Activities → Research.
 *
 * depth: 3 is what it takes to reach a preview image. The chain is research →
 * relatedBrochures (1) → file (2) → thumbnail (3), and Payload stops resolving
 * exactly at the depth it is given: at 2 the thumbnail came back as a bare id,
 * so `mediaUrl` had nothing to read and every PDF-backed output fell through
 * to the generic file placeholder.
 */
const RESEARCH_DEPTH = "3";

export const fetchResearch = () =>
  fetchCollection<PayloadResearchActivity>("research", { depth: RESEARCH_DEPTH });

/** One research area by its slug, for its own page. Undefined if no match. */
export async function fetchResearchBySlug(
  slug: string,
): Promise<PayloadResearchActivity | undefined> {
  const docs = await fetchCollection<PayloadResearchActivity>("research", {
    "where[slug][equals]": slug,
    depth: RESEARCH_DEPTH,
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

/** Everything in one of the publication collections, newest first. */
export const fetchPublications = (collection: PublicationCollection) =>
  // depth: 2 so item.image.thumbnail (the auto-generated PDF preview) resolves
  // to a full Media object, not just an id string.
  fetchCollection<PayloadPublication>(collection, { depth: "2", ...NEWEST_FIRST });

export const fetchInformation = (collection: InformationCollection) =>
  fetchCollection<PayloadInformationItem>(collection);

/**
 * The two standalone pages under About — the initiative's own page and
 * Partners. Each is a collection holding a single document, so the first one
 * is the page. Undefined if the backend is unreachable or nothing is published,
 * which leaves the calling page on its built-in copy.
 */
async function fetchSinglePage(collection: string): Promise<PayloadPage | undefined> {
  const docs = await fetchCollection<PayloadPage>(collection, { limit: "1", depth: "0" });
  return docs[0];
}

export const fetchAboutInitiative = () => fetchSinglePage("about-initiative");

export const fetchPartners = () => fetchSinglePage("partners");

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
