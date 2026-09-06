import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/practical-support/interns")({
  head: () => ({ meta: [{ title: "Interns — Dignity" }] }),
  component: InternsPage,
});

// Content shape not decided yet -- renders the shared placeholder until
// there's something real to put here.
function InternsPage() {
  const { t } = useLanguage();

  return (
    <SimplePage
      eyebrow={t("practicalSupport")}
      eyebrowColor={SECTION_COLORS.practicalSupport}
      title={t("practicalSupport.interns")}
    />
  );
}
