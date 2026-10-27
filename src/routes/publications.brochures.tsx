import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";
import { publicationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/publications/brochures")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(publicationsQuery("brochures"));
  },
  component: () => <PublicationsPage type="brochures" titleKey="publications.brochures" />,
});
