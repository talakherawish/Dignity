import { createFileRoute } from "@tanstack/react-router";
import { ActivityLinePage } from "@/components/ActivityLinePage";
import { useLanguage } from "@/contexts/LanguageContext";

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
      fallbackTitle={t("activities.taskForceAI")}
    />
  );
}
