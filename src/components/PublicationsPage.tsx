import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Play } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import {
  fetchPublicationsByType,
  formatDate,
  mediaUrl,
  youtubeThumbnail,
  youtubeThumbnailFallback,
  type PayloadPublication,
} from "@/lib/payload";
import { usePage } from "@/hooks/usePage";
import { withItalicQuotes } from "@/lib/text";

/** Normalized shape both Payload docs and hardcoded fallback items get mapped into. */
type DisplayPublication = {
  id: string;
  title: string;
  titleAr?: string;
  author?: string;
  authorAr?: string;
  date: string;
  fileUrl: string;
  imageUrl: string;
  imageIsPhoto: boolean;
  previewUrl: string;
  /** External destination (YouTube) for items that aren't uploads. */
  linkUrl: string;
};

function fromPayload(item: PayloadPublication): DisplayPublication {
  const imageIsPhoto = item.image?.mimeType?.startsWith("image/") ?? false;
  // Prefer a manually-set cover image if one exists; otherwise fall back to
  // the auto-generated PDF page-1 thumbnail attached to whichever media doc
  // (cover image or the file itself) has one, and finally — for link-only
  // items such as videos, which have no file to rasterise — the poster frame
  // published alongside the video itself.
  const previewUrl = imageIsPhoto
    ? mediaUrl(item.image)
    : mediaUrl(item.image?.thumbnail) ||
      mediaUrl(item.file?.thumbnail) ||
      youtubeThumbnail(item.link);
  return {
    linkUrl: item.link ?? "",
    id: item.id,
    title: item.title,
    titleAr: item.titleAr,
    author: item.author,
    authorAr: item.authorAr,
    date: item.date,
    fileUrl: mediaUrl(item.file),
    imageUrl: mediaUrl(item.image),
    imageIsPhoto,
    previewUrl,
  };
}

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
  const { data: payloadItems = [], isLoading } = useQuery({
    queryKey: ["publications", type],
    queryFn: () => fetchPublicationsByType(type),
    staleTime: 5 * 60 * 1000,
  });

  // Payload is the only source. A type with nothing published shows the empty
  // state below rather than a hardcoded stand-in nobody can edit.
  const items: DisplayPublication[] = payloadItems.map(fromPayload);

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
          // flex-wrap rather than grid so a partly-filled last row centres
          // instead of hugging the leading edge — a section with two entries
          // would otherwise sit alone in the first two of four columns. Card
          // widths reproduce the 2 / 4 column steps, less their share of the gap.
          <div
            className="flex flex-wrap justify-center gap-6"
            dir={isArabic ? "rtl" : "ltr"}
          >
            {items.map((item) => {
              const fileUrl = item.fileUrl;
              return (
                <div
                  key={item.id}
                  className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
                >
                  {/* Video items open on YouTube; document items keep the plain
                      preview, since their action lives in the download button. */}
                  {item.linkUrl ? (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={isArabic ? "مشاهدة الفيديو" : "Watch video"}
                      className="group block aspect-[1/1.41] bg-secondary/20 overflow-hidden"
                    >
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt=""
                          // A 16:9 still inside a portrait card: object-cover
                          // fills the width and trims the top and bottom rather
                          // than pillarboxing it against the card background.
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          onError={(e) => {
                            // maxresdefault does not exist for every video —
                            // drop to the always-present, equally unpadded mq
                            // still rather than showing a broken image.
                            const img = e.currentTarget;
                            const fallback = youtubeThumbnailFallback(item.linkUrl);
                            if (fallback && img.src !== fallback) img.src = fallback;
                          }}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <FileText className="h-10 w-10 text-muted-foreground/50" />
                        </span>
                      )}
                    </a>
                  ) : (
                    <div className="aspect-[1/1.41] bg-secondary/20 flex items-center justify-center">
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="h-10 w-10 text-muted-foreground/50" />
                      )}
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div
                      className={
                        "text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5" +
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
                      {item.linkUrl ? (
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={isArabic ? "مشاهدة الفيديو" : "Watch video"}
                          title={isArabic ? "مشاهدة الفيديو" : "Watch video"}
                          className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors"
                        >
                          <Play className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" />
                        </a>
                      ) : (
                        fileUrl && (
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
                        )
                      )}
                    </div>
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
