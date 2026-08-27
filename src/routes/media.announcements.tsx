import { createFileRoute, redirect } from "@tanstack/react-router";

type AnnouncementsSearch = { id?: string };

/**
 * Announcements merged into News & Announcements at /media/news. Announcement
 * documents were copied into the `news` collection at the database level,
 * keeping their ids, so an old ?id=... link still resolves once redirected.
 */
export const Route = createFileRoute("/media/announcements")({
  validateSearch: (search: Record<string, unknown>): AnnouncementsSearch => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/media/news", search: search.id ? { id: search.id } : {} });
  },
});
