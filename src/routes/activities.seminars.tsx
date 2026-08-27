import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Seminars merged into Activities -> Forums, filterable by type there.
 * Nothing moved at the database level -- Seminars is still its own Payload
 * collection (see fetchForums) -- only the site's navigation changed, so
 * this old link is kept alive as a redirect rather than a 404.
 */
export const Route = createFileRoute("/activities/seminars")({
  beforeLoad: () => {
    throw redirect({ to: "/activities/forums", search: { type: "seminar" } });
  },
});
