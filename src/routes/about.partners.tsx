import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { extractText, fetchPartners } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/about/partners")({
  head: () => ({ meta: [{ title: "Partners — Dignity" }] }),
  component: PartnersPage,
});

function PartnersPage() {
  const { t, isArabic } = useLanguage();

  // Edited in the CMS under About the Dignity Initiative → Partners; anything
  // left empty keeps the wording the page shipped with. No staleTime: an
  // editor publishing a change expects to see it on the next load.
  const { data: page } = useQuery({
    queryKey: ["partners-page"],
    queryFn: fetchPartners,
  });

  const body = extractText(isArabic ? page?.bodyAr : page?.body);

  return (
    <SimplePage
      eyebrow={t("about")}
      eyebrowColor={SECTION_COLORS.about}
      title={(isArabic ? page?.titleAr : page?.title) || t("about.partners")}
      description={(isArabic ? page?.descriptionAr : page?.description) || t("partners.page.desc")}
      body={body.length > 0 ? body : undefined}
    />
  );
}
