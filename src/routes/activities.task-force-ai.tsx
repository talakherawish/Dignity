import { createFileRoute } from "@tanstack/react-router";
import { ActivityLinePage } from "@/components/ActivityLinePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/activities/task-force-ai")({
  head: () => ({ meta: [{ title: "Task Force on AI — Dignity" }] }),
  component: TaskForceAIPage,
});

function TaskForceAIPage() {
  const { t } = useLanguage();

  return (
    <ActivityLinePage
      activityLine="task-force-ai"
      eyebrow={t("activities")}
      eyebrowColor={SECTION_COLORS.activities}
      fallbackTitle={t("activities.taskForceAI")}
    />
  );
}
