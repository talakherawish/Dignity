import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/papers")({
  head: () => ({ meta: [{ title: "Papers — Dignity" }] }),
  component: () => (
    <PublicationsPage type="papers" pageSlug="publications-papers" titleKey="publications.papers" />
  ),
});
