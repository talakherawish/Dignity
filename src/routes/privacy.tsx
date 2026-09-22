import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchPrivacyPolicy } from "@/lib/payload";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <LegalPage
      queryKey="privacy-policy"
      fetchPage={fetchPrivacyPolicy}
      fallbackTitle={t("footer.privacy")}
    />
  );
}
