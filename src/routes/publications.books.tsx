import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";

export const Route = createFileRoute("/publications/books")({
  head: () => ({ meta: [{ title: "Books — Dignity" }] }),
  component: () => (
    <PublicationsPage type="books" pageSlug="publications-books" titleKey="publications.books" />
  ),
});
