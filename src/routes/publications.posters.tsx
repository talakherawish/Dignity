import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/posters")({
  head: () => ({ meta: [{ title: "Posters — Dignity" }] }),
  component: () => (
    <PublicationsPage type="posters" pageSlug="publications-posters" titleKey="publications.posters" />
  ),
});
