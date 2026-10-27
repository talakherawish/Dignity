import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AboutPage } from "@/components/About";
import { useLanguage } from "@/contexts/LanguageContext";
import { extractListItems, extractText, formatted } from "@/lib/payload";
import { aboutInitiativeQuery } from "@/lib/queries";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { FormattedText } from "@/components/RichText";

const isAboutIndex = (pathname: string) => pathname === "/about" || pathname === "/about/";

export const Route = createFileRoute("/about")({
  // This route is also the layout around Participants and Partners, which
  // don't show the initiative's own text.
  loader: async ({ context, location }) => {
    if (isAboutIndex(location.pathname)) {
      await context.queryClient.ensureQueryData(aboutInitiativeQuery);
    }
  },
  component: AboutLayout,
});

function AboutLayout() {
  const { t, isArabic } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = isAboutIndex(pathname);

  // The page's own copy, edited in the CMS under About the Dignity Initiative →
  // The Dignity Research Initiative. Fetched on the server by the loader, so
  // the page arrives showing it. AboutPage's built-in text is only for when
  // Payload is unreachable and no earlier copy of the page is held either.
  const { data: page } = useQuery(aboutInitiativeQuery);

  if (isIndex) {
    const body = isArabic ? page?.bodyAr : page?.body;
    const title = formatted(page, "title", isArabic, { fallback: false });
    return (
      <AboutPage
        eyebrow={t("about")}
        eyebrowColor={SECTION_COLORS.about}
        title={title.text ? <FormattedText {...title} /> : t("about.initiative")}
        paragraphs={extractText(body)}
        items={extractListItems(body)}
      />
    );
  }

  return <Outlet />;
}
