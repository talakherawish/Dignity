import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { BookOpen, CalendarDays, FlaskConical, Globe2, Presentation } from "lucide-react";
import { SectionHubPage, type SectionTile } from "@/components/SectionHub";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/activities")({
  head: () => ({ meta: [{ title: "Activities — Dignity" }] }),
  component: ActivitiesLayout,
});

const TILES: SectionTile[] = [
  { labelKey: "activities.research", to: "/projects/research", icon: FlaskConical },
  { labelKey: "activities.seminars", to: "/activities/seminars", icon: BookOpen },
  { labelKey: "activities.conferences", to: "/activities/conferences", icon: Presentation },
  { labelKey: "activities.meetings", to: "/activities/meetings", icon: CalendarDays },
  { labelKey: "activities.windsor", to: "/activities/windsor-birzeit", icon: Globe2 },
];

// Having this file also makes it the layout route for every activities.*
// child (conferences, seminars, meetings, windsor-birzeit) -- each of those
// still renders its own full PageLayout, so the non-index branch here must
// stay a bare Outlet rather than wrapping them again.
function ActivitiesLayout() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = pathname === "/activities" || pathname === "/activities/";

  if (!isIndex) return <Outlet />;

  return (
    <SectionHubPage
      eyebrowColor={SECTION_COLORS.activities}
      title={t("activities")}
      tiles={TILES}
    />
  );
}
