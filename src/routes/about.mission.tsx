import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/about/mission")({
  head: () => ({ meta: [{ title: "Mission & Vision — Dignity" }] }),
  component: MissionPage,
});

function MissionPage() {
  const { t } = useLanguage();
  return (
    <SimplePage
      eyebrow={t("about")}
      title={t("about.mission")}
      description={t("mission.page.desc")}
    />
  );
}
