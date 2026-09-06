import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/working-group/practical-support")({
  head: () => ({ meta: [{ title: "Practical Support — Dignity" }] }),
  component: PracticalSupportPage,
});

// Content shape not decided yet -- renders the shared placeholder until
// there's something real to put here.
function PracticalSupportPage() {
  const { t } = useLanguage();

  return (
    <SimplePage
      eyebrow={t("workingGroup")}
      eyebrowColor={SECTION_COLORS.workingGroup}
      title={t("workingGroup.practicalSupport")}
    />
  );
}
