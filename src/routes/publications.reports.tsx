import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";
import { REPORTS_FALLBACK } from "@/data/publicationsFallback";

export const Route = createFileRoute("/publications/reports")({
  head: () => ({ meta: [{ title: "Reports — Dignity" }] }),
  component: () => (
    <PublicationsPage
      type="reports"
      pageSlug="publications-reports"
      titleKey="publications.reports"
      fallback={REPORTS_FALLBACK}
    />
  ),
});
