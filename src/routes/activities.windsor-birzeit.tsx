import { createFileRoute } from "@tanstack/react-router";
import { ActivityLinePage } from "@/components/ActivityLinePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/activities/windsor-birzeit")({
  component: WindsorPage,
});

function WindsorPage() {
  const { t } = useLanguage();

  return (
    <ActivityLinePage
      activityLine="windsor-birzeit"
      eyebrow={t("activities")}
      eyebrowColor={SECTION_COLORS.activities}
      fallbackTitle={t("activities.windsor")}
    />
  );
}
