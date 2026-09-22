import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchDisclaimer } from "@/lib/payload";

export const Route = createFileRoute("/disclaimer")({
  component: DisclaimerPage,
});

function DisclaimerPage() {
  const { t } = useLanguage();
  return (
    <LegalPage
      queryKey="disclaimer"
      fetchPage={fetchDisclaimer}
      fallbackTitle={t("footer.disclaimer")}
    />
  );
}
