import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/media/clippings")({
  head: () => ({ meta: [{ title: "Clippings — Dignity" }] }),
  component: ClippingsPage,
});

function ClippingsPage() {
  const { t } = useLanguage();
  return <SimplePage eyebrow={t("media")} title={t("media.clippings")} description={t("clippings.page.desc")} />;
}
