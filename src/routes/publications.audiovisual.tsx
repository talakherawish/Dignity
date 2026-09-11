import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/audiovisual")({
  component: () => <PublicationsPage type="audiovisual" titleKey="publications.audiovisual" />,
});
