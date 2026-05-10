import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/media/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Dignity" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { t } = useLanguage();
  return <SimplePage eyebrow={t("media")} title={t("media.announcements")} description={t("announcements.page.desc")} />;
}
