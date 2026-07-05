import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchActivitiesByType, formatDate, extractText, type PayloadActivity } from "@/lib/payload";
import { usePage } from "@/hooks/usePage";

export const Route = createFileRoute("/activities/seminars")({
  head: () => ({ meta: [{ title: "Seminars — Dignity" }] }),
  component: SeminarsPage,
});

function SeminarsPage() {
  const { t, lang, isArabic } = useLanguage();
    const page = usePage("seminars");
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["activities", "seminar"],
    queryFn: () => fetchActivitiesByType("seminar"),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
            <PageHero eyebrow={t("activities")} title={page.title ?? t("activities.seminars")} description={page.description ?? t("seminars.page.desc")} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-border rounded-sm h-28 bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد ندوات منشورة حالياً." : "No seminars published yet."}
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
