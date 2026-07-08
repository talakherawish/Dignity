import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/audiovisual")({
  head: () => ({ meta: [{ title: "Audiovisual — Dignity" }] }),
  component: () => (
    <PublicationsPage type="audiovisual" pageSlug="publications-audiovisual" titleKey="publications.audiovisual" />
  ),
});
