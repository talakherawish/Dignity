import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/theses")({
  component: () => <PublicationsPage type="theses" titleKey="publications.theses" />,
});
