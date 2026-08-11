import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActivityLedger } from "@/components/ActivityLedger";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchSeminars } from "@/lib/payload";

export const Route = createFileRoute("/activities/seminars")({
  head: () => ({ meta: [{ title: "Seminars — Dignity" }] }),
  component: SeminarsPage,
});

function SeminarsPage() {
  const { t, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["seminars"],
    queryFn: fetchSeminars,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={`${t("activities")} — ${t("activities.seminars")}`}
        title={t("activities.seminars")}
      />
      <ActivityLedger
        items={items}
        isLoading={isLoading}
        empty={isArabic ? "لا توجد ندوات منشورة حالياً." : "No seminars published yet."}
      />
    </PageLayout>
  );
}
