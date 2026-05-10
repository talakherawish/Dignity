import { createFileRoute } from "@tanstack/react-router";
import { ParticipantsGrid } from "@/components/ParticipantsGrid";

export const Route = createFileRoute("/about/participants/researchers")({
  head: () => ({ meta: [{ title: "Researchers — Dignity" }] }),
  component: () => <ParticipantsGrid titleKey="about.researchers" introKey="participants.intro.researchers" />,
});
