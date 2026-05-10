import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/media/photos")({
  head: () => ({ meta: [{ title: "Photos — Dignity" }] }),
  component: PhotosPage,
});

function PhotosPage() {
  const { t } = useLanguage();
  return <SimplePage eyebrow={t("media")} title={t("media.photos")} description={t("photos.page.desc")} />;
}
