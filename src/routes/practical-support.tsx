import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";
import { SectionHubPage, type SectionTile } from "@/components/SectionHub";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/practical-support")({
  head: () => ({ meta: [{ title: "Practical Support — Dignity" }] }),
  component: PracticalSupportLayout,
});

const TILES: SectionTile[] = [
  { labelKey: "practicalSupport.interns", to: "/practical-support/interns", icon: HeartHandshake },
];

// Having this file also makes it the layout route for every
// practical-support.* child -- each still renders its own full PageLayout,
// so the non-index branch here must stay a bare Outlet rather than wrapping
// them again.
function PracticalSupportLayout() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = pathname === "/practical-support" || pathname === "/practical-support/";

  if (!isIndex) return <Outlet />;

  return (
    <SectionHubPage
      eyebrowColor={SECTION_COLORS.practicalSupport}
      title={t("practicalSupport")}
      tiles={TILES}
    />
  );
}
