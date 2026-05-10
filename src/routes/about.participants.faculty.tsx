import { createFileRoute } from "@tanstack/react-router";
import { ParticipantsGrid } from "@/components/ParticipantsGrid";

export const Route = createFileRoute("/about/participants/faculty")({
  head: () => ({ meta: [{ title: "Faculty — Dignity" }] }),
  component: () => <ParticipantsGrid titleKey="about.faculty" introKey="participants.intro.faculty" />,
});
