import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AboutPage } from "@/components/About";
import { useLanguage } from "@/contexts/LanguageContext";
import { extractListItems, extractText, fetchAboutInitiative } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "The Dignity Research Initiative — Dignity" }] }),
  component: AboutLayout,
});

function AboutLayout() {
  const { t, isArabic } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = pathname === "/about" || pathname === "/about/";

  // The page's own copy, edited in the CMS under About the Dignity Initiative →
  // The Dignity Research Initiative. AboutPage falls back to its built-in text
  // for anything empty or still loading, so this only ever adds. No
  // staleTime: an editor publishing a change expects to see it on the next
  // load.
  const { data: page } = useQuery({
    queryKey: ["about-initiative"],
    queryFn: fetchAboutInitiative,
  });

  if (isIndex) {
    const body = isArabic ? page?.bodyAr : page?.body;
    return (
      <AboutPage
        eyebrow={t("about")}
        eyebrowColor={SECTION_COLORS.about}
        title={(isArabic ? page?.titleAr : page?.title) || t("about.initiative")}
        description={(isArabic ? page?.descriptionAr : page?.description) || t("about.page.desc")}
        paragraphs={extractText(body)}
        items={extractListItems(body)}
      />
    );
  }

  return <Outlet />;
}
