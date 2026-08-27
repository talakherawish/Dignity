import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchWindsorDignity, formatDate, type PayloadActivity } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";
export const Route = createFileRoute("/activities/windsor-birzeit")({
  head: () => ({ meta: [{ title: "The Windsor Birzeit Dignity Initiative — Dignity" }] }),
  component: WindsorPage,
});

function WindsorPage() {
  const { t, lang, isArabic } = useLanguage();
  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["windsor-dignity"],
    queryFn: fetchWindsorDignity,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("activities")}
        eyebrowColor={SECTION_COLORS.activities}
        title={t("activities.windsor")}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="border border-border rounded-sm h-28 bg-secondary/30 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic
              ? "لا توجد فعاليات منشورة حالياً."
              : "No Windsor-Birzeit activities published yet."}
          </p>
        ) : (
          <div className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item: PayloadActivity) => {
              return (
                <div
                  key={item.id}
                  className="border border-border rounded-sm bg-card p-6 hover:shadow-sm transition-shadow"
                >
                  <div
                    className={
                      "text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2" +
                      (isArabic ? " text-right" : "")
                    }
                  >
                    {formatDate(item.date, lang === "ar" ? "ar" : "en")}
                  </div>
                  <h3
                    className={
                      "font-serif text-sm text-primary leading-snug mb-2" +
                      (isArabic ? " text-right" : "")
                    }
                  >
                    {lang === "ar" ? (item.titleAr ?? item.title) : item.title}
                  </h3>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
