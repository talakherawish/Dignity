import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";
import { publicationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/publications/theses")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(publicationsQuery("theses"));
  },
  component: () => <PublicationsPage type="theses" titleKey="publications.theses" />,
});
