import { createFileRoute } from "@tanstack/react-router";
import { PublicationsPage } from "@/components/PublicationsPage";
import { publicationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/publications/audiovisual")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(publicationsQuery("audiovisual"));
  },
  component: () => <PublicationsPage type="audiovisual" titleKey="publications.audiovisual" />,
});
