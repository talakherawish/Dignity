import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/activities/seminars")({
  head: () => ({ meta: [{ title: "Seminars — Dignity" }] }),
  component: SeminarsPage,
});

function SeminarsPage() {
  const { t } = useLanguage();
  return <SimplePage eyebrow={t("activities")} title={t("activities.seminars")} description={t("seminars.page.desc")} />;
}
