import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GalleryPage } from "@/components/GalleryPage";
import { toGalleryPhoto } from "@/components/PhotoGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchPhotos } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/media/photos")({
  component: PhotosPage,
});

function PhotosPage() {
  const { t, lang, isArabic } = useLanguage();
  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["photos"],
    queryFn: fetchPhotos,
  });

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
