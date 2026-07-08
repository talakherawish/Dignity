import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import {
  fetchInformationByType,
  extractText,
  mediaUrl,
  type PayloadInformationItem,
} from "@/lib/payload";
import { usePage } from "@/hooks/usePage";

export function InformationPage({
  type,
  pageSlug,
  titleKey,
}: {
  type: PayloadInformationItem["type"];
  pageSlug: string;
  titleKey: TranslationKey;
}) {
  const { t, lang, isArabic } = useLanguage();
  const page = usePage(pageSlug);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["information", type],
    queryFn: () => fetchInformationByType(type),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("information")}
        title={page.title ?? t(titleKey)}
        description={page.description ?? t("information.page.desc")}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-border rounded-sm h-24 bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">{t("information.empty")}</p>
        ) : (
          <div className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item: PayloadInformationItem) => {
              const desc = extractText(
                lang === "ar" ? (item.descriptionAr ?? item.description) : item.description,
              );
              const fileUrl = mediaUrl(item.file);
              return (
                <div
                  key={item.id}
                  className="border border-border rounded-sm bg-card p-6 hover:shadow-sm transition-shadow flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  <div className="flex-1">
                    <h3
                      className={
                        "font-serif text-lg text-primary leading-snug mb-2" + (isArabic ? " text-right" : "")
                      }
                    >
                      {lang === "ar" ? (item.titleAr ?? item.title) : item.title}
                    </h3>
                    {desc.length > 0 && (
                      <p
                        className={
                          "text-sm text-muted-foreground leading-relaxed" + (isArabic ? " text-right" : "")
                        }
                      >
                        {desc[0]}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-foreground/80 hover:text-accent hover:border-accent/40 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t("information.visit")}
                      </a>
                    )}
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-foreground/80 hover:text-accent hover:border-accent/40 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t("publications.download")}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
