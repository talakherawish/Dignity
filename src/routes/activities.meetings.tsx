import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActivityLedger } from "@/components/ActivityLedger";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchMeetings } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/activities/meetings")({
  head: () => ({ meta: [{ title: "Meetings — Dignity" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { t, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("activities")}
        eyebrowColor={SECTION_COLORS.activities}
        title={t("activities.meetings")}
      />
      <ActivityLedger
        items={items}
        isLoading={isLoading}
        empty={isArabic ? "لا توجد اجتماعات منشورة حالياً." : "No meetings published yet."}
      />
    </PageLayout>
  );
}
