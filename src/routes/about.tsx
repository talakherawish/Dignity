import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { AboutPage } from "@/components/About";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "The Dignity Research Initiative — Dignity" }] }),
  component: AboutLayout,
});

function AboutLayout() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = pathname === "/about" || pathname === "/about/";

  if (isIndex) {
    return (
      <AboutPage
        eyebrow={t("about")}
        title={t("about.initiative")}
        description={t("about.page.desc")}
      />
    );
  }

  return <Outlet />;
}
