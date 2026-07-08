import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/InformationPage";

export const Route = createFileRoute("/information/databases")({
  head: () => ({ meta: [{ title: "Databases — Dignity" }] }),
  component: () => (
    <InformationPage type="databases" pageSlug="information-databases" titleKey="information.databases" />
  ),
});
