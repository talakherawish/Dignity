import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import {
  PublicationCard,
  PublicationCardGrid,
  PUBLICATION_GRID_SKELETON,
} from "@/components/PublicationCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchClippings, mediaUrl, type PayloadClipping } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/media/clippings")({
  head: () => ({ meta: [{ title: "Clippings — Dignity" }] }),
  component: ClippingsPage,
});

function ClippingsPage() {
  const { t, isArabic } = useLanguage();
  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["clippings"],
    queryFn: fetchClippings,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("about")}
        eyebrowColor={SECTION_COLORS.about}
        title={t("media.clippings")}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className={PUBLICATION_GRID_SKELETON}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="border border-border rounded-sm h-96 bg-secondary/30 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد مقالات صحفية منشورة حالياً." : "No clippings published yet."}
          </p>
        ) : (
          <PublicationCardGrid>
            {items.map((item: PayloadClipping) => {
              const url = mediaUrl(item.image);
              const isImage = item.image?.mimeType?.startsWith("image/") ?? false;
              const previewSource = isImage ? item.image : item.image?.thumbnail;
              return (
                <PublicationCard
                  key={item.id}
                  title={item.title}
                  titleAr={item.titleAr}
                  date={item.date}
                  previewUrl={mediaUrl(previewSource)}
                  previewWidth={previewSource?.width}
                  previewHeight={previewSource?.height}
                  preview={url ? "clipping" : "none"}
                  fileUrl={url}
                  fileMimeType={item.image?.mimeType}
                />
              );
            })}
          </PublicationCardGrid>
        )}
      </section>
    </PageLayout>
  );
}
