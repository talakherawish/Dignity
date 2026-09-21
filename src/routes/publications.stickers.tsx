import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GalleryPage } from "@/components/GalleryPage";
import type { GalleryPhoto } from "@/components/PhotoGallery";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchStickers, mediaUrl, type PayloadSticker } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/publications/stickers")({
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
