import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GalleryPage } from "@/components/GalleryPage";
import type { GalleryPhoto } from "@/components/PhotoGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchClippings, mediaUrl, type PayloadClipping } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/media/clippings")({
  component: ClippingsPage,
});

/** Most clippings are a plain scanned image; a PDF upload falls back to its
 * auto-generated page-1 thumbnail, same as the publication cards this page
 * used to render. */
function toGalleryClipping(item: PayloadClipping): GalleryPhoto {
  const isImage = item.image?.mimeType?.startsWith("image/") ?? false;
  const previewSource = isImage ? item.image : item.image?.thumbnail;
  return {
    id: item.id,
    url: mediaUrl(previewSource),
    width: previewSource?.width,
    height: previewSource?.height,
  };
}

function ClippingsPage() {
  const { t, isArabic } = useLanguage();
  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["clippings"],
    queryFn: fetchClippings,
  });

  return (
    <GalleryPage
      eyebrow={t("about")}
      eyebrowColor={SECTION_COLORS.about}
      title={t("media.clippings")}
      photos={items.map(toGalleryClipping)}
      isLoading={isLoading}
      empty={isArabic ? "لا توجد مقالات صحفية منشورة حالياً." : "No clippings published yet."}
    />
  );
}
