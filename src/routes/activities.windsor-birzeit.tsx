import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/activities/windsor-birzeit")({
  head: () => ({ meta: [{ title: "Windsor-Birzeit Initiative — Dignity" }] }),
  component: WindsorPage,
});

function WindsorPage() {
  const { t } = useLanguage();
  return <SimplePage eyebrow={t("activities")} title={t("activities.windsor")} description={t("windsor.page.desc")} />;
}
