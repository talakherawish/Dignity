import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Stickers moved from About the Dignity Initiative to Publications, and was
 * renamed Stickers & Bookmarks -- see publications.stickers.tsx. Nothing
 * moved at the database level, only the site's navigation, so this old link
 * is kept alive as a redirect rather than a 404.
 */
export const Route = createFileRoute("/media/stickers")({
  beforeLoad: () => {
    throw redirect({ to: "/publications/stickers" });
  },
});
