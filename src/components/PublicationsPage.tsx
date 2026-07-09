import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import {
  fetchPublicationsByType,
  formatDate,
  extractText,
  mediaUrl,
  type PayloadPublication,
} from "@/lib/payload";
import { usePage } from "@/hooks/usePage";
import { withItalicQuotes } from "@/lib/text";

export function PublicationsPage({
  type,
  pageSlug,
  titleKey,
}: {
  type: PayloadPublication["type"];
  pageSlug: string;
  titleKey: TranslationKey;
}) {
  const { t, lang, isArabic } = useLanguage();
  const page = usePage(pageSlug);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["publications", type],
    queryFn: () => fetchPublicationsByType(type),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("publications")}
        title={page.title ?? t(titleKey)}
        description={page.description ?? t("publications.page.desc")}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-border rounded-sm h-28 bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">{t("publications.empty")}</p>
        ) : (
          <div className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item: PayloadPublication) => {
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
                    <div
                      className={
                        "text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2" +
                        (isArabic ? " text-right" : "")
                      }
                    >
                      {formatDate(item.date, lang === "ar" ? "ar" : "en")}
                      {(item.author || item.authorAr) && (
                        <span> · {lang === "ar" ? (item.authorAr ?? item.author) : item.author}</span>
                      )}
                    </div>
                    <h3
                      className={
                        "font-serif text-lg text-primary leading-snug mb-2" + (isArabic ? " text-right" : "")
                      }
                    >
                      {withItalicQuotes(lang === "ar" ? (item.titleAr ?? item.title) : item.title)}
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
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 shrink-0 px-4 py-2 rounded-full border border-border text-sm text-foreground/80 hover:text-accent hover:border-accent/40 transition-colors self-start"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("publications.download")}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
