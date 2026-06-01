import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About the Initiative — Dignity" }] }),
  component: AboutLayout,
});

function AboutLayout() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = pathname === "/about" || pathname === "/about/";

  if (isIndex) {
    return (
      <SimplePage
        eyebrow={t("about")}
        title={t("about.initiative")}
        description={t("about.page.desc")}
      />
    );
  }

  return <Outlet />;
}
