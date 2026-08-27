import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import {
  fetchInformation,
  mediaUrl,
  openFileInNewTab,
  resolveAttachment,
  type InformationCollection,
  type PayloadInformationItem,
} from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export function InformationPage({
  type,
  titleKey,
  breadcrumb,
}: {
  type: InformationCollection;
  titleKey: TranslationKey;
  breadcrumb?: string;
}) {
  const { t, lang, isArabic } = useLanguage();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["information", type],
    queryFn: () => fetchInformation(type),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={breadcrumb || t("information")}
        eyebrowColor={SECTION_COLORS.information}
        title={t(titleKey)}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="border border-border rounded-sm h-24 bg-secondary/30 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {t("information.empty")}
          </p>
        ) : (
          <div className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item: PayloadInformationItem) => {
              // Link and file are independent per language (see
              // resolveAttachment): a plain value with no Arabic counterpart is
              // shared across both languages, while an Arabic-only value means
              // an English reader sees a fallback notice instead of an action.
              const resolvedLink = resolveAttachment(item.link, item.linkAr, isArabic);
              const resolvedFile = resolveAttachment(
                mediaUrl(item.file) || undefined,
                mediaUrl(item.fileAr) || undefined,
                isArabic,
              );
              const link = resolvedLink.value;
              const fileUrl = resolvedFile.value;
              const fileMimeType =
                isArabic && item.fileAr ? item.fileAr.mimeType : item.file?.mimeType;
              const attachmentMissing =
                !link && !fileUrl && (resolvedLink.missing || resolvedFile.missing);
              return (
                <div
                  key={item.id}
                  className="border border-border rounded-sm bg-card p-6 hover:shadow-sm transition-shadow flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  <div className="flex-1">
                    <h3
                      className={
                        "font-serif text-sm text-primary leading-snug mb-2" +
                        (isArabic ? " text-right" : "")
                      }
                    >
                      {lang === "ar" ? (item.titleAr ?? item.title) : item.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-foreground/80 hover:text-accent hover:border-accent/40 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t("information.visit")}
                      </a>
                    )}
                    {fileUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => openFileInNewTab(fileUrl, fileMimeType)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-foreground/80 hover:text-accent hover:border-accent/40 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t("publications.view")}
                        </button>
                        <a
                          href={fileUrl}
                          download
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-foreground/80 hover:text-accent hover:border-accent/40 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t("publications.download")}
                        </a>
                      </>
                    )}
                    {attachmentMissing && <TranslationNotice compact />}
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
