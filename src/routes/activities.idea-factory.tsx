import { createFileRoute } from "@tanstack/react-router";
import { ActivityLinePage } from "@/components/ActivityLinePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/activities/idea-factory")({
  head: () => ({ meta: [{ title: "Idea Factory — Dignity" }] }),
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
