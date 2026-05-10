import { ImagePlaceholder } from "./PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";

export function ParticipantsGrid({
  titleKey,
  introKey,
  count = 6,
}: {
  titleKey: TranslationKey;
  introKey: TranslationKey;
  count?: number;
}) {
  const { t } = useLanguage();
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="font-serif text-2xl text-primary mb-3">{t(titleKey)}</h2>
      <p className="text-muted-foreground max-w-3xl mb-10 leading-relaxed">{t(introKey)}</p>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="border border-border rounded-md overflow-hidden bg-card">
            <ImagePlaceholder label="Portrait placeholder" ratio="1/1" />
            <div className="p-5">
              <div className="font-serif text-lg text-primary">{t("participants.name")}</div>
              <div className="text-sm text-accent mt-0.5">{t("participants.role")}</div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {t("participants.bio")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
