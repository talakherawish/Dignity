import { createFileRoute } from "@tanstack/react-router";
import { ActivityLinePage } from "@/components/ActivityLinePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { activityLineQuery } from "@/lib/queries";

export const Route = createFileRoute("/activities/windsor-birzeit")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(activityLineQuery("windsor-birzeit"));
  },
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
