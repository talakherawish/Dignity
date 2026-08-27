import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { PhotoGallery, type GalleryPhoto } from "@/components/PhotoGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchStickers, mediaUrl, type PayloadSticker } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/media/stickers")({
  head: () => ({ meta: [{ title: "Stickers — Dignity" }] }),
  component: StickersPage,
});

function toGallerySticker(sticker: PayloadSticker, lang: "en" | "ar"): GalleryPhoto {
  const caption = lang === "ar" ? (sticker.titleAr ?? sticker.title) : sticker.title;
  return {
    id: sticker.id,
    url: mediaUrl(sticker.image),
    caption: caption || undefined,
    date: sticker.date,
    width: sticker.image?.width,
    height: sticker.image?.height,
  };
}

function StickersPage() {
  const { t, lang, isArabic } = useLanguage();
  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["stickers"],
    queryFn: fetchStickers,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("about")}
        eyebrowColor={SECTION_COLORS.about}
        title={t("about.stickers")}
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
            {isArabic ? "لا توجد ملصقات منشورة حالياً." : "No stickers published yet."}
          </p>
        ) : (
          <PhotoGallery
            photos={items
              .map((item) => toGallerySticker(item, lang === "ar" ? "ar" : "en"))
              // An entry whose upload went missing would otherwise render as a
              // broken image in the middle of the gallery.
              .filter((photo) => photo.url)}
          />
        )}
      </section>
    </PageLayout>
  );
}
