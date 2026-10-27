import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";
import { publicationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/publications/reports")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(publicationsQuery("reports"));
  },
  component: () => <PublicationsPage type="reports" titleKey="publications.reports" />,
});
