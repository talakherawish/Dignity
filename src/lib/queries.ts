import { queryOptions } from "@tanstack/react-query";
import {
  fetchAboutInitiative,
  fetchActivityLine,
  fetchBibliographyCounts,
  fetchBibliographyEntries,
  fetchClippings,
  fetchDatabase,
  fetchDatabases,
  fetchDisclaimer,
  fetchForums,
  fetchNews,
  fetchPageText,
  fetchParticipants,
  fetchPartners,
  fetchPhotos,
  fetchPrivacyPolicy,
  fetchPublications,
  fetchReadingCounts,
  fetchReadingItems,
  fetchReadingList,
  fetchReadingLists,
  fetchResearch,
  fetchResearchBySlug,
  fetchSiteSettings,
  fetchStickers,
  type ActivityLine,
  type PublicationCollection,
} from "./payload";

/**
 * Every piece of Payload content a page shows, as one react-query entry each.
 *
 * A route's loader fetches what its page needs with these on the server, so
 * the page arrives already showing what Payload holds -- not built-in text
 * that is swapped for the real content a moment later. The page's components
 * read the same entries with useQuery and find them already filled. Loader and
 * component must use the same entry, which is why both take it from here.
 */

/**
 * A single document that may not exist, as null rather than undefined: react-
 * query treats undefined data as a failed fetch, which would turn a page with
 * nothing published yet into an error page.
 */
const orNull =
  <T>(fetch: () => Promise<T | undefined>) =>
  async (): Promise<T | null> =>
    (await fetch()) ?? null;

export const siteSettingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: fetchSiteSettings,
});

export const aboutInitiativeQuery = queryOptions({
  queryKey: ["about-initiative"],
  queryFn: orNull(fetchAboutInitiative),
});

export const disclaimerQuery = queryOptions({
  queryKey: ["disclaimer"],
  queryFn: orNull(fetchDisclaimer),
});

export const privacyPolicyQuery = queryOptions({
  queryKey: ["privacy-policy"],
  queryFn: orNull(fetchPrivacyPolicy),
});

export const newsQuery = queryOptions({ queryKey: ["news"], queryFn: fetchNews });

export const participantsQuery = queryOptions({
  queryKey: ["participants"],
  queryFn: fetchParticipants,
});

export const partnersQuery = queryOptions({ queryKey: ["partners"], queryFn: fetchPartners });

export const forumsQuery = queryOptions({ queryKey: ["forums"], queryFn: fetchForums });

export const photosQuery = queryOptions({ queryKey: ["photos"], queryFn: fetchPhotos });

export const clippingsQuery = queryOptions({ queryKey: ["clippings"], queryFn: fetchClippings });

export const stickersQuery = queryOptions({ queryKey: ["stickers"], queryFn: fetchStickers });

export const researchQuery = queryOptions({ queryKey: ["research"], queryFn: fetchResearch });

export const researchBySlugQuery = (slug: string) =>
  queryOptions({ queryKey: ["research", slug], queryFn: orNull(() => fetchResearchBySlug(slug)) });

export const activityLineQuery = (line: ActivityLine) =>
  queryOptions({
    queryKey: ["activity-line", line],
    queryFn: orNull(() => fetchActivityLine(line)),
  });

export const publicationsQuery = (type: PublicationCollection) =>
  queryOptions({ queryKey: ["publications", type], queryFn: () => fetchPublications(type) });

export const pageTextQuery = (global: "databases-page" | "readings-page") =>
  queryOptions({ queryKey: [global], queryFn: () => fetchPageText(global) });

export const databasesQuery = queryOptions({ queryKey: ["databases"], queryFn: fetchDatabases });

export const databaseCountsQuery = queryOptions({
  queryKey: ["databases", "counts"],
  queryFn: fetchBibliographyCounts,
});

export const databaseQuery = (slug: string) =>
  queryOptions({ queryKey: ["database", slug], queryFn: orNull(() => fetchDatabase(slug)) });

export const bibliographyEntriesQuery = (databaseId: string) =>
  queryOptions({
    queryKey: ["bibliography-entries", databaseId],
    queryFn: () => fetchBibliographyEntries(databaseId),
  });

export const readingListsQuery = queryOptions({
  queryKey: ["reading-lists"],
  queryFn: fetchReadingLists,
});

export const readingCountsQuery = queryOptions({
  queryKey: ["reading-lists", "counts"],
  queryFn: fetchReadingCounts,
});

export const readingListQuery = (slug: string) =>
  queryOptions({ queryKey: ["reading-list", slug], queryFn: orNull(() => fetchReadingList(slug)) });

export const readingItemsQuery = (subjectId: string) =>
  queryOptions({ queryKey: ["readings", subjectId], queryFn: () => fetchReadingItems(subjectId) });
