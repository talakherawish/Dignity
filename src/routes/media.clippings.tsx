import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchMediaUpdatesByType, formatDate, mediaUrl, type PayloadMediaUpdate } from "@/lib/payload";

export const Route = createFileRoute("/media/clippings")({
  head: () => ({ meta: [{ title: "Clippings — Dignity" }] }),
  component: ClippingsPage,
});

function ClippingsPage() {
  const { t, lang, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["media-updates", "clipping"],
    queryFn: () => fetchMediaUpdatesByType("clipping"),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
      <PageHero eyebrow={t("media")} title={t("media.clippings")} description={t("clippings.page.desc")} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-border rounded-sm h-24 bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد مقالات صحفية منشورة حالياً." : "No clippings published yet."}
          </p>
        ) : (
          <div className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item: PayloadMediaUpdate) => {
              const url = mediaUrl(item.image);
              return (
                <div key={item.id} className="border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow grid md:grid-cols-[120px_1fr]">
                  {url && (
                    <img src={url} alt="" className="w-full h-full object-cover md:h-28" />
                  )}
                  <div className={"p-5" + (isArabic ? " text-right" : "")}>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                      {formatDate(item.date, lang === "ar" ? "ar" : "en")}
                    </div>
                    <h3 className="font-serif text-lg text-primary leading-snug">
                      {lang === "ar" ? (item.titleAr ?? item.title) : item.title}
                    </h3>
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
