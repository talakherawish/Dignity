import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/InformationPage";

export const Route = createFileRoute("/information/readings")({
  head: () => ({ meta: [{ title: "Readings and Documents — Dignity" }] }),
  component: () => (
    <InformationPage
      type="readings-documents"
      pageSlug="information-readings"
      titleKey="information.readings"
    />
  ),
});
