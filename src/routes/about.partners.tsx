import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/about/partners")({
  head: () => ({ meta: [{ title: "Partners — Dignity" }] }),
  component: PartnersPage,
});

function PartnersPage() {
  const { t } = useLanguage();
  return <SimplePage eyebrow={t("about")} title={t("about.partners")} description={t("partners.page.desc")} />;
}
