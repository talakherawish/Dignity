import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchMediaUpdatesByType, formatDate, mediaUrl, type PayloadMediaUpdate } from "@/lib/payload";
import { usePage } from "@/hooks/usePage";

export const Route = createFileRoute("/media/photos")({
  head: () => ({ meta: [{ title: "Photos — Dignity" }] }),
  component: PhotosPage,
});

function PhotosPage() {
  const { t, lang, isArabic } = useLanguage();
      const page = usePage("photos");
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["media-updates", "photo"],
    queryFn: () => fetchMediaUpdatesByType("photo"),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
            <PageHero eyebrow={t("media")} title={page.title ?? t("media.photos")} description={page.description ?? t("photos.page.desc")} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="border border-border rounded-md aspect-video bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد صور منشورة حالياً." : "No photos published yet."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item: PayloadMediaUpdate) => {
              const url = mediaUrl(item.image);
              return (
                <div key={item.id} className="border border-border rounded-md overflow-hidden bg-card group">
                  {url ? (
                    <img src={url} alt={lang === "ar" ? (item.titleAr ?? item.title) : item.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full aspect-video bg-secondary/40 flex items-center justify-center text-xs text-muted-foreground">
                      {isArabic ? "لا توجد صورة" : "No image"}
                    </div>
                  )}
                  <div className={"p-4" + (isArabic ? " text-right" : "")}>
                    <p className="text-sm font-medium text-primary">
                      {lang === "ar" ? (item.titleAr ?? item.title) : item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDate(item.date, lang === "ar" ? "ar" : "en")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
