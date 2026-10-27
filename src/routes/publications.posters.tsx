import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";
import { publicationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/publications/posters")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(publicationsQuery("posters"));
  },
  component: () => <PublicationsPage type="posters" titleKey="publications.posters" />,
});
