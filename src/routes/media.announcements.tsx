import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchMediaUpdatesByType, formatDate, type PayloadMediaUpdate } from "@/lib/payload";

export const Route = createFileRoute("/media/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Dignity" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { t, lang, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["media-updates", "announcement"],
    queryFn: () => fetchMediaUpdatesByType("announcement"),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
      <PageHero eyebrow={t("media")} title={t("media.announcements")} description={t("announcements.page.desc")} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-border rounded-lg h-36 bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد إعلانات منشورة حالياً." : "No announcements published yet."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item: PayloadMediaUpdate) => (
              <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="h-1 w-full" style={{ background: "var(--brand-magenta)" }} />
                <div className={"p-6" + (isArabic ? " text-right" : "")}>
                  <div className={"font-semibold mb-2 text-muted-foreground" + (isArabic ? " text-sm" : " text-[9px] uppercase tracking-widest")}>
                    {isArabic ? "إعلان" : "Announcement"}
                  </div>
                  <p className={"font-medium text-primary leading-snug mb-4" + (isArabic ? " text-base" : " text-sm")}>
                    {lang === "ar" ? (item.titleAr ?? item.title) : item.title}
                  </p>
                  <div className={"font-medium tracking-wide" + (isArabic ? " text-sm" : " text-[10px]")} style={{ color: "var(--brand-magenta)" }}>
                    {formatDate(item.date, lang === "ar" ? "ar" : "en")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
