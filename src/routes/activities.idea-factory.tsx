import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/activities/idea-factory")({
  head: () => ({ meta: [{ title: "Idea Factory — Dignity" }] }),
  component: IdeaFactoryPage,
});

// Content shape not decided yet -- renders the shared placeholder until
// there's something real to put here.
function IdeaFactoryPage() {
  const { t } = useLanguage();

  return (
    <SimplePage
      eyebrow={t("activities")}
      eyebrowColor={SECTION_COLORS.activities}
      title={t("activities.ideaFactory")}
    />
  );
}
