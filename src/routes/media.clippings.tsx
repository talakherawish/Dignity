import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GalleryPage } from "@/components/GalleryPage";
import type { GalleryPhoto } from "@/components/PhotoGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { mediaSrcSet, mediaUrl, type PayloadClipping } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { clippingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/media/clippings")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(clippingsQuery);
  },
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
    srcSet: mediaSrcSet(previewSource),
    width: previewSource?.width,
    height: previewSource?.height,
  };
}

function ClippingsPage() {
  const { t, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery(clippingsQuery);

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
