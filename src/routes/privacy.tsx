import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { useLanguage } from "@/contexts/LanguageContext";
import { privacyPolicyQuery } from "@/lib/queries";

export const Route = createFileRoute("/privacy")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(privacyPolicyQuery);
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useLanguage();
  return <LegalPage query={privacyPolicyQuery} fallbackTitle={t("footer.privacy")} />;
}
