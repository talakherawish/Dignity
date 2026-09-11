import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/posters")({
  component: () => <PublicationsPage type="posters" titleKey="publications.posters" />,
});
