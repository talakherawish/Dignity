import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardList,
  FileStack,
  FileText,
  GraduationCap,
  Image,
  Video,
} from "lucide-react";
import { SectionHubPage, type SectionTile } from "@/components/SectionHub";
import { useLanguage } from "@/contexts/LanguageContext";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/publications")({
  head: () => ({ meta: [{ title: "Publications — Dignity" }] }),
  component: PublicationsHub,
});

const TILES: SectionTile[] = [
  { labelKey: "publications.books", to: "/publications/books", icon: BookOpen },
  { labelKey: "publications.papers", to: "/publications/papers", icon: FileText },
  { labelKey: "publications.reports", to: "/publications/reports", icon: ClipboardList },
  { labelKey: "publications.brochures", to: "/publications/brochures", icon: FileStack },
  { labelKey: "publications.theses", to: "/publications/theses", icon: GraduationCap },
  { labelKey: "publications.audiovisual", to: "/publications/audiovisual", icon: Video },
  { labelKey: "publications.posters", to: "/publications/posters", icon: Image },
];

function PublicationsHub() {
  const { t } = useLanguage();
  return (
    <SectionHubPage
      eyebrowColor={SECTION_COLORS.publications}
      title={t("publications")}
      description={t("publications.page.desc")}
      tiles={TILES}
    />
  );
}
