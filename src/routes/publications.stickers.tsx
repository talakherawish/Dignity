import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GalleryPage } from "@/components/GalleryPage";
import type { GalleryPhoto } from "@/components/PhotoGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { mediaSrcSet, mediaUrl, type PayloadSticker, formatted } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { siteSettingsQuery, stickersQuery } from "@/lib/queries";
import { isPageShown } from "@/lib/hiddenPages";

export const Route = createFileRoute("/publications/stickers")({
  loader: async ({ context }) => {
    // Switched off in Site Settings until it has content -- see hiddenPages.
    const settings = await context.queryClient.ensureQueryData(siteSettingsQuery);
    if (!isPageShown("/publications/stickers", settings)) throw notFound();
    await context.queryClient.ensureQueryData(stickersQuery);
  },
  component: StickersPage,
});

function toGallerySticker(sticker: PayloadSticker, lang: "en" | "ar"): GalleryPhoto {
  const caption = formatted(sticker, "title", lang === "ar");
  return {
    id: sticker.id,
    url: mediaUrl(sticker.image),
    srcSet: mediaSrcSet(sticker.image),
    caption: caption.text || undefined,
    captionRich: caption.rich,
    date: sticker.date,
    width: sticker.image?.width,
    height: sticker.image?.height,
  };
}

function StickersPage() {
  const { t, lang, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery(stickersQuery);

  return (
    <GalleryPage
      eyebrow={t("publications")}
      eyebrowColor={SECTION_COLORS.publications}
      title={t("publications.stickers")}
      photos={items.map((item) => toGallerySticker(item, lang === "ar" ? "ar" : "en"))}
      isLoading={isLoading}
      empty={
        isArabic
          ? "لا توجد ملصقات أو فواصل كتب منشورة حالياً."
          : "No stickers or bookmarks published yet."
      }
    />
  );
}
