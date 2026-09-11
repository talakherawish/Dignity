import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/InformationPage";

export const Route = createFileRoute("/information/databases")({
  component: () => <InformationPage type="databases" titleKey="information.databases" />,
});
