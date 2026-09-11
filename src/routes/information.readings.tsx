import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/InformationPage";

export const Route = createFileRoute("/information/readings")({
  component: () => <InformationPage type="readings-documents" titleKey="information.readings" />,
});
