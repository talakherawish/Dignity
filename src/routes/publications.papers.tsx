import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";
import { publicationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/publications/papers")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(publicationsQuery("papers"));
  },
  component: () => <PublicationsPage type="papers" titleKey="publications.papers" />,
});
