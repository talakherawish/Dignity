import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/activities/conferences")({
  head: () => ({ meta: [{ title: "Conferences — Dignity" }] }),
  component: ConferencesPage,
});

function ConferencesPage() {
  const { t } = useLanguage();
  return <SimplePage eyebrow={t("activities")} title={t("activities.conferences")} description={t("conferences.page.desc")} />;
}
