import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { HeartHandshake, Users } from "lucide-react";
import { SectionHubPage, type SectionTile } from "@/components/SectionHub";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/working-group")({
  head: () => ({ meta: [{ title: "Working Group — Dignity" }] }),
  component: WorkingGroupLayout,
});

const TILES: SectionTile[] = [
  {
    labelKey: "workingGroup.practicalSupport",
    to: "/working-group/practical-support",
    icon: HeartHandshake,
  },
  { labelKey: "workingGroup.interns", to: "/working-group/interns", icon: Users },
];

// Having this file also makes it the layout route for every working-group.*
// child -- each still renders its own full PageLayout, so the non-index
// branch here must stay a bare Outlet rather than wrapping them again.
function WorkingGroupLayout() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = pathname === "/working-group" || pathname === "/working-group/";

  if (!isIndex) return <Outlet />;

  return (
    <SectionHubPage
      eyebrowColor={SECTION_COLORS.workingGroup}
      title={t("workingGroup")}
      tiles={TILES}
    />
  );
}
