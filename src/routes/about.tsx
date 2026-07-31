import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { AboutPage } from "@/components/About";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePage } from "@/hooks/usePage";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "The Dignity Research Initiative — Dignity" }] }),
  component: AboutLayout,
});

function AboutLayout() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = pathname === "/about" || pathname === "/about/";
  const page = usePage("about");

  if (isIndex) {
    return (
      <AboutPage
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
