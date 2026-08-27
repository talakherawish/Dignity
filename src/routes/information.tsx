import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { BookMarked, Database } from "lucide-react";
import { SectionHubPage, type SectionTile } from "@/components/SectionHub";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/information")({
  head: () => ({ meta: [{ title: "Information — Dignity" }] }),
  component: InformationLayout,
});

const TILES: SectionTile[] = [
  { labelKey: "information.readings", to: "/information/readings", icon: BookMarked },
  { labelKey: "information.databases", to: "/information/databases", icon: Database },
];

// Having this file also makes it the layout route for every information.*
// child -- each still renders its own full PageLayout, so the non-index
// branch here must stay a bare Outlet rather than wrapping them again.
function InformationLayout() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = pathname === "/information" || pathname === "/information/";

  if (!isIndex) return <Outlet />;

  return (
    <SectionHubPage
      eyebrowColor={SECTION_COLORS.information}
      title={t("information")}
      description={t("information.page.desc")}
      tiles={TILES}
    />
  );
}
