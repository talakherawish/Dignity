import { createFileRoute } from "@tanstack/react-router";
import { BookMarked, Database } from "lucide-react";
import { SectionHubPage, type SectionTile } from "@/components/SectionHub";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/information")({
  head: () => ({ meta: [{ title: "Information — Dignity" }] }),
  component: InformationHub,
});

const TILES: SectionTile[] = [
  { labelKey: "information.readings", to: "/information/readings", icon: BookMarked },
  { labelKey: "information.databases", to: "/information/databases", icon: Database },
];

function InformationHub() {
  const { t } = useLanguage();
  return (
    <SectionHubPage
      eyebrowColor={SECTION_COLORS.information}
      title={t("information")}
      description={t("information.page.desc")}
      tiles={TILES}
    />
  );
}
