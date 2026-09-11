import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/papers")({
  component: () => <PublicationsPage type="papers" titleKey="publications.papers" />,
});
