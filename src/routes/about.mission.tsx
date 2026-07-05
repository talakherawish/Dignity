import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePage } from "@/hooks/usePage";

export const Route = createFileRoute("/about/mission")({
  head: () => ({ meta: [{ title: "Mission & Vision — Dignity" }] }),
  component: MissionPage,
});

function MissionPage() {
  const { t } = useLanguage();
    const page = usePage("mission");
  return (
    <SimplePage
      eyebrow={t("about")}
            title={page.title ?? t("about.mission")}
            description={page.description ?? t("mission.page.desc")}
            body={page.body}
    />
  );
}
