import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { PhotoGallery, type GalleryPhoto } from "@/components/PhotoGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchPhotos, mediaUrl, type PayloadPhoto } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/media/photos")({
  head: () => ({ meta: [{ title: "Photos — Dignity" }] }),
  component: PhotosPage,
});

function PhotosPage() {
  const { t, lang, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["photos"],
    queryFn: fetchPhotos,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("about")}
        eyebrowColor={SECTION_COLORS.about}
        title={t("media.photos")}
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
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد صور منشورة حالياً." : "No photos published yet."}
          </p>
        ) : (
          <PhotoGallery
            photos={items
              .map((item: PayloadPhoto): GalleryPhoto => {
                const caption = lang === "ar" ? (item.titleAr ?? item.title) : item.title;
                return {
                  id: item.id,
                  url: mediaUrl(item.image),
                  caption: caption || undefined,
                  date: item.date,
                  width: item.image?.width,
                  height: item.image?.height,
                };
              })
              // An entry whose upload went missing would otherwise render as a
              // broken image in the middle of the gallery.
              .filter((photo) => photo.url)}
          />
        )}
      </section>
    </PageLayout>
  );
}
