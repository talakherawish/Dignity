import { createFileRoute } from "@tanstack/react-router";
import { ParticipantsGrid } from "@/components/ParticipantsGrid";

export const Route = createFileRoute("/about/participants/students")({
  head: () => ({ meta: [{ title: "Students — Dignity" }] }),
  component: () => <ParticipantsGrid titleKey="about.students" introKey="participants.intro.students" />,
});
