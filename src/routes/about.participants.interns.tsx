import { createFileRoute } from "@tanstack/react-router";
import { ParticipantsGrid } from "@/components/ParticipantsGrid";

export const Route = createFileRoute("/about/participants/interns")({
  head: () => ({ meta: [{ title: "Interns — Dignity" }] }),
  component: () => <ParticipantsGrid titleKey="about.interns" introKey="participants.intro.interns" />,
});
