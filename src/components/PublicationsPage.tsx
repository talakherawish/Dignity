import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
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
import type { PublicationFallbackItem } from "@/data/publicationsFallback";

/** Normalized shape both Payload docs and hardcoded fallback items get mapped into. */
type DisplayPublication = {
  id: string;
  title: string;
  titleAr?: string;
  author?: string;
  authorAr?: string;
  date: string;
  descLines: string[];
  descLinesAr: string[];
  fileUrl: string;
  imageUrl: string;
  imageIsPhoto: boolean;
  previewUrl: string;
};

function fromPayload(item: PayloadPublication): DisplayPublication {
  const imageIsPhoto = item.image?.mimeType?.startsWith("image/") ?? false;
  // Prefer a manually-set cover image if one exists; otherwise fall back to
  // the auto-generated PDF page-1 thumbnail attached to whichever media doc
  // (cover image or the file itself) has one.
  const previewUrl = imageIsPhoto
    ? mediaUrl(item.image)
    : mediaUrl(item.image?.thumbnail) || mediaUrl(item.file?.thumbnail);
  return {
    id: item.id,
    title: item.title,
    titleAr: item.titleAr,
    author: item.author,
    authorAr: item.authorAr,
    date: item.date,
    descLines: extractText(item.description),
    descLinesAr: extractText(item.descriptionAr),
    fileUrl: mediaUrl(item.file),
    imageUrl: mediaUrl(item.image),
    imageIsPhoto,
    previewUrl,
  };
}

function fromFallback(item: PublicationFallbackItem): DisplayPublication {
  return {
    id: item.id,
    title: item.title,
    titleAr: item.titleAr,
    author: item.author,
    authorAr: item.authorAr,
    date: item.date,
    descLines: item.description ? [item.description] : [],
    descLinesAr: item.descriptionAr ? [item.descriptionAr] : [],
    fileUrl: item.fileUrl,
    imageUrl: "",
    imageIsPhoto: false,
    previewUrl: "",
  };
}

export function PublicationsPage({
  type,
  pageSlug,
  titleKey,
  fallback = [],
}: {
  type: PayloadPublication["type"];
  pageSlug: string;
  titleKey: TranslationKey;
  fallback?: PublicationFallbackItem[];
}) {
  const { t, lang, isArabic } = useLanguage();
  const page = usePage(pageSlug);
  const { data: payloadItems = [], isLoading } = useQuery({
    queryKey: ["publications", type],
    queryFn: () => fetchPublicationsByType(type),
    staleTime: 5 * 60 * 1000,
  });

  const items: DisplayPublication[] =
    payloadItems.length > 0 ? payloadItems.map(fromPayload) : fallback.map(fromFallback);

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("publications")}
        title={page.title ?? t(titleKey)}
        description={page.description ?? t("publications.page.desc")}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="border border-border rounded-sm h-96 bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">{t("publications.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item) => {
              const desc =
                lang === "ar" ? (item.descLinesAr.length > 0 ? item.descLinesAr : item.descLines) : item.descLines;
              const fileUrl = item.fileUrl;
              return (
                <div
                  key={item.id}
                  className="border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
                >
                  <div className="aspect-[1/1.41] bg-secondary/20 flex items-center justify-center">
                    {item.previewUrl ? (
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div
                      className={
                        "text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5" +
                        (isArabic ? " text-right" : "")
                      }
                    >
                      {formatDate(item.date, lang === "ar" ? "ar" : "en")}
                      {(item.author || item.authorAr) && (
                        <span> · {lang === "ar" ? (item.authorAr ?? item.author) : item.author}</span>
                      )}
                    </div>
                    <div
                      className={
                        "flex items-start justify-between gap-3" +
                        (isArabic ? " flex-row-reverse text-right" : "")
                      }
                    >
                      <h3 className="font-serif text-lg text-primary leading-snug">
                        {withItalicQuotes(lang === "ar" ? (item.titleAr ?? item.title) : item.title)}
                      </h3>
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t("publications.download")}
                          title={t("publications.download")}
                          className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    {desc.length > 0 && (
                      <p
                        className={
                          "text-sm text-muted-foreground leading-relaxed mt-2" +
                          (isArabic ? " text-right" : "")
                        }
                      >
                        {desc[0]}
                      </p>
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
