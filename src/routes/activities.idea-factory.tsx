import { createFileRoute } from "@tanstack/react-router";
import { ActivityLinePage } from "@/components/ActivityLinePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { activityLineQuery } from "@/lib/queries";

export const Route = createFileRoute("/activities/idea-factory")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(activityLineQuery("idea-factory"));
  },
  component: IdeaFactoryPage,
});

function IdeaFactoryPage() {
  const { t } = useLanguage();

  return (
    <ActivityLinePage
      activityLine="idea-factory"
      eyebrow={t("activities")}
      eyebrowColor={SECTION_COLORS.activities}
      fallbackTitle={t("activities.ideaFactory")}
    />
  );
}
