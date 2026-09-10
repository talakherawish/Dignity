import { createFileRoute } from "@tanstack/react-router";
import { ActivityLinePage } from "@/components/ActivityLinePage";
import { useLanguage } from "@/contexts/LanguageContext";

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
      fallbackTitle={t("activities.ideaFactory")}
    />
  );
}
