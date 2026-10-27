import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";
import { publicationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/publications/books")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(publicationsQuery("books"));
  },
  component: () => <PublicationsPage type="books" titleKey="publications.books" />,
});
