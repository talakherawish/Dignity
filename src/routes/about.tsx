import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
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
      <SimplePage
        eyebrow={t("about")}
        title={page.title ?? t("about.initiative")}
                description={page.description ?? t("about.page.desc")}
                body={page.body}
      />
    );
  }

  return <Outlet />;
}
