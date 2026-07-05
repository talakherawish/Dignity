import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/SimplePage";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePage } from "@/hooks/usePage";

export const Route = createFileRoute("/about/partners")({
  head: () => ({ meta: [{ title: "Partners — Dignity" }] }),
  component: PartnersPage,
});

function PartnersPage() {
  const { t } = useLanguage();
    const page = usePage("partners");
    return (
          <SimplePage
                  eyebrow={t("about")}
                  title={page.title ?? t("about.partners")}
                  description={page.description ?? t("partners.page.desc")}
                  body={page.body}
                />
        );
}
