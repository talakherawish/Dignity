import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/theses")({
  head: () => ({ meta: [{ title: "Theses — Dignity" }] }),
  component: () => (
    <PublicationsPage type="theses" pageSlug="publications-theses" titleKey="publications.theses" />
  ),
});
