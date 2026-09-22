import type { TranslationKey } from "@/contexts/LanguageContext";
import {
  extractText,
  fetchAboutInitiative,
  fetchClippings,
  fetchForums,
  fetchInformation,
  fetchNews,
  fetchParticipants,
  fetchPartners,
  fetchPublications,
  fetchResearch,
  populated,
  type PayloadParticipant,
  type PublicationCollection,
} from "@/lib/payload";

export type SearchResult = {
  typeKey: TranslationKey;
  title: string;
  titleAr: string;
  excerpt: string;
  excerptAr: string;
  /** Lowercased title + excerpt + full body text, in both languages — what a query is matched against. Not rendered. */
  searchText: string;
  to: string;
};

/** Plain string fields and Lexical richText fields both flatten to their text here, so every collection's mix of the two can be matched the same way. */
function fullText(...parts: unknown[]): string {
  return parts
    .flatMap((part) => (typeof part === "string" ? [part] : extractText(part)))
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

function truncate(text: string, max = 180): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd() + "…";
}

/**
 * Builds one result. `display`/`displayAr` become the excerpt shown under the
 * title; `extraSearch` is matched against but never shown — an author name or
 * a role, say, findable without cluttering every row with it.
 */
function makeResult(opts: {
  typeKey: TranslationKey;
  title: string;
  titleAr?: string;
  to: string;
  display?: unknown[];
  displayAr?: unknown[];
  extraSearch?: unknown[];
}): SearchResult {
  const titleAr = opts.titleAr?.trim() || opts.title;
  const enBody = fullText(...(opts.display ?? []));
  const arBody = fullText(...(opts.displayAr ?? opts.display ?? []));
  const extra = fullText(...(opts.extraSearch ?? []));
  return {
    typeKey: opts.typeKey,
    title: opts.title,
    titleAr,
    excerpt: truncate(enBody),
    excerptAr: truncate(arBody || enBody),
    searchText: [opts.title, titleAr, enBody, arBody, extra].join(" ").toLowerCase(),
    to: opts.to,
  };
}

const PUBLICATION_TYPES: {
  collection: PublicationCollection;
  typeKey: TranslationKey;
  to: string;
}[] = [
  { collection: "books", typeKey: "publications.books", to: "/publications/books" },
  { collection: "papers", typeKey: "publications.papers", to: "/publications/papers" },
  { collection: "reports", typeKey: "publications.reports", to: "/publications/reports" },
  { collection: "brochures", typeKey: "publications.brochures", to: "/publications/brochures" },
  { collection: "theses", typeKey: "publications.theses", to: "/publications/theses" },
  {
    collection: "audiovisual",
    typeKey: "publications.audiovisual",
    to: "/publications/audiovisual",
  },
  { collection: "posters", typeKey: "publications.posters", to: "/publications/posters" },
];

/**
 * Every searchable document on the site, normalized into one flat list.
 *
 * Fetches every collection in parallel — the same handful of endpoints each
 * listing page already calls on its own — rather than standing up a separate
 * search endpoint on the backend. The result is cached by the caller's
 * react-query hook, so this only runs again once it goes stale.
 */
export async function buildSearchIndex(): Promise<SearchResult[]> {
  const [
    news,
    forums,
    research,
    participants,
    clippings,
    readings,
    databases,
    aboutInitiative,
    partners,
    ...publicationLists
  ] = await Promise.all([
    fetchNews(),
    fetchForums(),
    fetchResearch(),
    fetchParticipants(),
    fetchClippings(),
    fetchInformation("readings-documents"),
    fetchInformation("databases"),
    fetchAboutInitiative(),
    fetchPartners(),
    ...PUBLICATION_TYPES.map((p) => fetchPublications(p.collection)),
  ]);

  const results: SearchResult[] = [];

  for (const item of news)
    results.push(
      makeResult({
        typeKey: "media.news",
        title: item.title,
        titleAr: item.titleAr,
        display: [item.excerpt, item.content],
        displayAr: [item.excerptAr, item.contentAr],
        to: "/media/news",
      }),
    );

  for (const item of forums)
    results.push(
      makeResult({
        typeKey: "activities.forums",
        title: item.title,
        titleAr: item.titleAr,
        display: [item.content],
        displayAr: [item.contentAr],
        to: "/activities/forums",
      }),
    );

  for (const item of research)
    results.push(
      makeResult({
        typeKey: "projects.research",
        title: item.title,
        titleAr: item.titleAr,
        display: [item.content],
        displayAr: [item.contentAr],
        to: item.slug ? `/projects/research/${item.slug}` : "/projects/research",
      }),
    );

  for (const item of partners)
    results.push(
      makeResult({
        typeKey: "about.partners",
        title: item.name,
        titleAr: item.nameAr,
        display: [item.description],
        displayAr: [item.descriptionAr],
        to: "/about/partners",
      }),
    );

  for (const item of participants)
    results.push(
      makeResult({
        typeKey: "about.participants",
        title: item.name,
        titleAr: item.nameAr,
        display: [item.title, item.bio],
        displayAr: [item.titleAr, item.bioAr],
        to: "/about/participants",
      }),
    );

  // Clippings are the one searched collection whose title is optional -- one
  // that speaks for itself carries no caption at all. An untitled clipping has
  // no text to match a query against, so it is left out rather than added as a
  // nameless row. A clipping named in only one language is kept, under the
  // name it does have.
  for (const item of clippings) {
    const title = item.title?.trim() || item.titleAr?.trim();
    if (!title) continue;
    results.push(
      makeResult({
        typeKey: "media.clippings",
        title,
        titleAr: item.titleAr,
        to: "/media/clippings",
      }),
    );
  }

  const infoGroups: { items: typeof readings; typeKey: TranslationKey; to: string }[] = [
    { items: readings, typeKey: "information.readings", to: "/information/readings" },
    { items: databases, typeKey: "information.databases", to: "/information/databases" },
  ];
  for (const group of infoGroups)
    for (const item of group.items)
      results.push(
        makeResult({
          typeKey: group.typeKey,
          title: item.title,
          titleAr: item.titleAr,
          display: [item.description],
          displayAr: [item.descriptionAr],
          to: group.to,
        }),
      );

  publicationLists.forEach((list, i) => {
    const { typeKey, to } = PUBLICATION_TYPES[i];
    for (const item of list)
      results.push(
        makeResult({
          typeKey,
          title: item.title,
          titleAr: item.titleAr,
          display: [item.description],
          displayAr: [item.descriptionAr],
          extraSearch: [
            item.author,
            item.authorAr,
            ...populated<PayloadParticipant>(item.authorParticipants).flatMap((p) => [
              p.name,
              p.nameAr,
            ]),
          ],
          to,
        }),
      );
  });

  if (aboutInitiative?.title)
    results.push(
      makeResult({
        typeKey: "about.initiative",
        title: aboutInitiative.title,
        titleAr: aboutInitiative.titleAr,
        display: [aboutInitiative.body],
        displayAr: [aboutInitiative.bodyAr],
        to: "/about",
      }),
    );

  return results;
}
