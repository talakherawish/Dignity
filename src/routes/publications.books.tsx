import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/books")({
  component: () => <PublicationsPage type="books" titleKey="publications.books" />,
});
