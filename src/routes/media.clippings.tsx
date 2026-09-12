import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { PhotoGallery, type GalleryPhoto } from "@/components/PhotoGallery";
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

  const photos = items.map(toGalleryClipping).filter((photo) => photo.url);

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("about")}
        eyebrowColor={SECTION_COLORS.about}
        title={t("media.clippings")}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          // Mixed widths at one height, so the placeholder rows read like the
          // justified rows that replace them.
          <div className="flex flex-wrap [--row-height:12rem] sm:[--row-height:16rem] lg:[--row-height:20rem]">
            {[1.5, 0.75, 1.3, 1.8, 1, 1.4].map((ratio, n) => (
              <div
                key={n}
                style={{ flexGrow: ratio, flexBasis: `calc(var(--row-height) * ${ratio})` }}
                className="h-[var(--row-height)] bg-secondary/30 animate-pulse"
              />
            ))}
            <span aria-hidden className="grow-[999] basis-0 h-0" />
          </div>
        ) : photos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد مقالات صحفية منشورة حالياً." : "No clippings published yet."}
          </p>
        ) : (
          <PhotoGallery photos={photos} />
        )}
      </section>
    </PageLayout>
  );
}
