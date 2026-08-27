import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Meetings dissolved into Activities -> Forums -- there's no separate
 * Meetings section any more. Nothing moved at the database level -- Meetings
 * is still its own Payload collection (see fetchForums), just tagged with a
 * forumType now instead of listed on its own page -- so this old link is
 * kept alive as a redirect rather than a 404. No single type fits "Meetings"
 * the way seminar/conference did for those redirects, so this lands on the
 * unfiltered Forums page rather than presetting a tab.
 */
export const Route = createFileRoute("/activities/meetings")({
  beforeLoad: () => {
    throw redirect({ to: "/activities/forums" });
  },
});
