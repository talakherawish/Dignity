import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About the Initiative — Dignity" }] }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useLanguage();
  return (
    <SimplePage
      eyebrow={t("about")}
      title={t("about.initiative")}
      description={t("about.page.desc")}
    />
  );
}
