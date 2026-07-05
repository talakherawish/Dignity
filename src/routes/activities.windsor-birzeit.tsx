import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchActivitiesByType, formatDate, extractText, type PayloadActivity } from "@/lib/payload";

export const Route = createFileRoute("/activities/windsor-birzeit")({
  head: () => ({ meta: [{ title: "Windsor-Birzeit Initiative — Dignity" }] }),
  component: WindsorPage,
});

function WindsorPage() {
  const { t, lang, isArabic } = useLanguage();
    const page = usePage("windsor");
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["activities", "windsor-birzeit"],
    queryFn: () => fetchActivitiesByType("windsor-birzeit"),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
            <PageHero eyebrow={t("activities")} title={page.title ?? t("activities.windsor")} description={page.description ?? t("windsor.page.desc")} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-border rounded-sm h-28 bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد فعاليات منشورة حالياً." : "No Windsor-Birzeit activities published yet."}
          </p>
        ) : (
          <div className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item: PayloadActivity) => {
              const desc = extractText(lang === "ar" ? (item.descriptionAr ?? item.description) : item.description);
              return (
                <div key={item.id} className="border border-border rounded-sm bg-card p-6 hover:shadow-sm transition-shadow">
                  <div className={"text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2" + (isArabic ? " text-right" : "")}>
                    {formatDate(item.date, lang === "ar" ? "ar" : "en")}
                  </div>
                  <h3 className={"font-serif text-lg text-primary leading-snug mb-2" + (isArabic ? " text-right" : "")}>
                    {lang === "ar" ? (item.titleAr ?? item.title) : item.title}
                  </h3>
                  {desc.length > 0 && (
                    <p className={"text-sm text-muted-foreground leading-relaxed" + (isArabic ? " text-right" : "")}>
                      {desc[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
