import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { useLanguage } from "@/contexts/LanguageContext";
import { disclaimerQuery } from "@/lib/queries";

export const Route = createFileRoute("/disclaimer")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(disclaimerQuery);
  },
  component: DisclaimerPage,
});

function DisclaimerPage() {
  const { t } = useLanguage();
  return <LegalPage query={disclaimerQuery} fallbackTitle={t("footer.disclaimer")} />;
}
