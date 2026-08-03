import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchMeetings, formatDate, type PayloadActivity } from "@/lib/payload";
export const Route = createFileRoute("/activities/meetings")({
  head: () => ({ meta: [{ title: "Meetings — Dignity" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { t, lang, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={`${t("activities")} — ${t("activities.meetings")}`}
        title={t("activities.meetings")}
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
            {isArabic ? "لا توجد اجتماعات منشورة حالياً." : "No meetings published yet."}
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
