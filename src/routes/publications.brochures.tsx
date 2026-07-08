import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/brochures")({
  head: () => ({ meta: [{ title: "Brochures — Dignity" }] }),
  component: () => (
    <PublicationsPage type="brochures" pageSlug="publications-brochures" titleKey="publications.brochures" />
  ),
});
