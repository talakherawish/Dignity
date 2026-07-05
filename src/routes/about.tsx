import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { AboutMissionPage } from "@/components/AboutMission";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePage } from "@/hooks/usePage";

export const Route = createFileRoute("/about")({
    head: () => ({ meta: [{ title: "About the Initiative — Dignity" }] }),
    component: AboutLayout,
});

function AboutLayout() {
    const { t } = useLanguage();
    const { pathname } = useLocation();
    const isIndex = pathname === "/about" || pathname === "/about/";
    const page = usePage("about");

  if (isIndex) {
        return (
                <AboutMissionPage
                          eyebrow={t("about")}
                          title={page.title ?? t("about.initiative")}
                          description={page.description ?? t("about.page.desc")}
                          paragraphs={page.paragraphs}
                          items={page.items}
                        />
              );
  }

  return <Outlet />;
}
