import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GalleryPage } from "@/components/GalleryPage";
import { toGalleryPhoto } from "@/components/PhotoGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { photosQuery } from "@/lib/queries";

export const Route = createFileRoute("/media/photos")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(photosQuery);
  },
  component: PhotosPage,
});

function PhotosPage() {
  const { t, lang, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery(photosQuery);

  return (
    <GalleryPage
      eyebrow={t("about")}
      eyebrowColor={SECTION_COLORS.about}
      title={t("media.photos")}
      photos={items.map((item) => toGalleryPhoto(item, lang === "ar" ? "ar" : "en"))}
      isLoading={isLoading}
      empty={isArabic ? "لا توجد صور منشورة حالياً." : "No photos published yet."}
    />
  );
}
