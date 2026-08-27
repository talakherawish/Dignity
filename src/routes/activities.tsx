import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  FlaskConical,
  Globe2,
  Presentation,
} from "lucide-react";
import { SectionHubPage, type SectionTile } from "@/components/SectionHub";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/activities")({
  head: () => ({ meta: [{ title: "Activities — Dignity" }] }),
  component: ActivitiesHub,
});

const TILES: SectionTile[] = [
  { labelKey: "activities.research", to: "/projects/research", icon: FlaskConical },
  { labelKey: "activities.seminars", to: "/activities/seminars", icon: BookOpen },
  { labelKey: "activities.conferences", to: "/activities/conferences", icon: Presentation },
  { labelKey: "activities.meetings", to: "/activities/meetings", icon: CalendarDays },
  { labelKey: "activities.windsor", to: "/activities/windsor-birzeit", icon: Globe2 },
];

function ActivitiesHub() {
  const { t } = useLanguage();
  return (
    <SectionHubPage
      eyebrowColor={SECTION_COLORS.activities}
      title={t("activities")}
      tiles={TILES}
    />
  );
}
