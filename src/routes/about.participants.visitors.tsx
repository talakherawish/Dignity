import { createFileRoute } from "@tanstack/react-router";
import { ParticipantsGrid } from "@/components/ParticipantsGrid";

export const Route = createFileRoute("/about/participants/visitors")({
  head: () => ({ meta: [{ title: "Visitors — Dignity" }] }),
  component: () => <ParticipantsGrid titleKey="about.visitors" introKey="participants.intro.visitors" />,
});
