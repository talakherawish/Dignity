import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/activities/meetings")({
  head: () => ({ meta: [{ title: "Meetings — Dignity" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { t } = useLanguage();
  return <SimplePage eyebrow={t("activities")} title={t("activities.meetings")} description={t("meetings.page.desc")} />;
}
