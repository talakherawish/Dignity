import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Bot, FlaskConical, Globe2, Lightbulb, Presentation } from "lucide-react";
import { SectionHubPage, type SectionTile } from "@/components/SectionHub";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/activities")({
  head: () => ({ meta: [{ title: "Activities — Dignity" }] }),
  component: ActivitiesLayout,
});

// Seminars, Roundtables, Workshops, Conferences, and Meetings used to be (or,
// for Roundtables/Workshops, would have been) separate tiles here; they're
// all now sub-types filtered on the single Forums tile -- see
// activities.forums.tsx. Meetings itself no longer has a tile or a page --
// every meeting is a forum event now, tagged (or not yet tagged) with one of
// the five types.
//
// Idea Factory and Task Force on AI are placeholders -- see
// activities.idea-factory.tsx and activities.task-force-ai.tsx -- until
// their content shape is decided.
const TILES: SectionTile[] = [
  { labelKey: "activities.research", to: "/projects/research", icon: FlaskConical },
  { labelKey: "activities.forums", to: "/activities/forums", icon: Presentation },
  { labelKey: "activities.windsor", to: "/activities/windsor-birzeit", icon: Globe2 },
  { labelKey: "activities.ideaFactory", to: "/activities/idea-factory", icon: Lightbulb },
  { labelKey: "activities.taskForceAI", to: "/activities/task-force-ai", icon: Bot },
];

// Having this file also makes it the layout route for every activities.*
// child (forums, and the seminars/conferences/meetings redirects into it,
// plus windsor-birzeit) -- each of those still renders its own full
// PageLayout, so the non-index branch here must stay a bare Outlet rather
// than wrapping them again.
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
