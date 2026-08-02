import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/reports")({
  head: () => ({ meta: [{ title: "Reports — Dignity" }] }),
  component: () => (
    <PublicationsPage
      type="reports"
      titleKey="publications.reports"
    />
  ),
});
