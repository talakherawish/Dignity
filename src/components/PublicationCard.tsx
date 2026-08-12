import { Download, FileText, Play } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, youtubeThumbnailFallback } from "@/lib/payload";
import { withItalicQuotes } from "@/lib/text";

/**
 * The document card shown by every publication-shaped grid on the site —
 * Publications, Clippings, and both grids on a research entry's page.
 *
 * All four were the same markup pasted four times, which is how they drifted:
 * some bottom-aligned the title, some italicised quoted titles, and the
 * download button sat on the title's own line in three of them. That last one
 * was the real cost — a 32px button plus its gap took 27% of the title's width
 * on a phone, leaving an 86px column that broke "Decolonizing Knowledge
 * Production…" across ten lines at eleven characters each.
 *
 * The title now gets the card's full width and the action sits in its own row
 * pinned to the bottom, so it also lines up across cards in a row.
 */

/**
 * Card width per breakpoint, shared so the four grids can't drift apart.
 *
 * One column on phones: at the old two-up the card was 160px wide, which no
 * amount of typographic tuning could make a readable measure. Two from `sm`,
 * four from `lg` — the steps the grids already used, less their share of the
 * gap.
 */
const CARD_WIDTH = "w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]";

/** The same steps as `CARD_WIDTH`, for the loading skeletons. */
export const PUBLICATION_GRID_SKELETON = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6";

/**
 * flex-wrap rather than grid so a partly-filled last row centres instead of
 * hugging the leading edge — a section with two entries would otherwise sit
 * alone in the first two of four columns.
 */
export function PublicationCardGrid({ children }: { children: ReactNode }) {
  const { isArabic } = useLanguage();
  return (
    <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
      {children}
    </div>
  );
}

export type PublicationCardProps = {
  title: string;
  titleAr?: string;
  author?: string;
  authorAr?: string;
  date?: string;
  /** Thumbnail to show in the preview well; a file icon stands in when absent. */
  previewUrl?: string;
  /**
   * Shape of the preview well. Documents are A4-proportioned, clippings are
   * squarer, and `none` drops the well for items carrying no media at all.
   */
  preview?: "document" | "clipping" | "none";
  /** Attached file — rendered as the download action. */
  fileUrl?: string;
  /** External destination (YouTube), which makes the thumbnail clickable and
   * swaps the download action for a play button. */
  linkUrl?: string;
  /** Headings inside a section that already has its own h3 pass "h4". */
  as?: "h3" | "h4";
};

export function PublicationCard({
  title,
  titleAr,
  author,
  authorAr,
  date,
  previewUrl,
  preview = "document",
  fileUrl,
  linkUrl,
  as: Heading = "h3",
}: PublicationCardProps) {
  const { t, lang, isArabic } = useLanguage();
  const isAr = lang === "ar";
  const displayTitle = isAr ? (titleAr ?? title) : title;
  const displayAuthor = isAr ? (authorAr ?? author) : author;
  const watchLabel = isArabic ? "مشاهدة الفيديو" : "Watch video";

  const thumbnail = previewUrl ? (
    <img
      src={previewUrl}
      alt=""
      // object-top rather than centred: the well is capped in height so a
      // full-width phone card isn't one screen of PDF, and a document's
      // identifying half is its top.
      className="w-full h-full object-cover object-top"
      onError={(e) => {
        // maxresdefault does not exist for every video — drop to the
        // always-present, equally unpadded mq still rather than showing a
        // broken image.
        const img = e.currentTarget;
        const fallback = youtubeThumbnailFallback(linkUrl ?? "");
        if (fallback && img.src !== fallback) img.src = fallback;
      }}
    />
  ) : (
    <FileText className="h-10 w-10 text-muted-foreground/50" />
  );

  const wellClass =
    (preview === "clipping" ? "aspect-[3/4]" : "aspect-[1/1.41]") +
    " max-h-[26rem] bg-secondary/20 overflow-hidden flex items-center justify-center";

  const action = linkUrl ? (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={watchLabel}
      title={watchLabel}
      className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors"
    >
      <Play className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" />
    </a>
  ) : fileUrl ? (
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
  ) : null;

  return (
    <div
      className={
        CARD_WIDTH +
        " border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
      }
    >
      {/* Video items open on YouTube; document items keep the plain preview,
          since their action lives in the button below. */}
      {preview !== "none" &&
        (linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={watchLabel}
            className={"group block " + wellClass}
          >
            <div className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]">
              {thumbnail}
            </div>
          </a>
        ) : (
          <div className={wellClass}>{thumbnail}</div>
        ))}

      <div className="p-5 flex flex-col flex-1 text-start">
        {(date || displayAuthor) && (
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
            {date && formatDate(date, isAr ? "ar" : "en")}
            {displayAuthor && (
              <span>
                {date ? " · " : ""}
                {displayAuthor}
              </span>
            )}
          </div>
        )}

        {/* text-balance evens out the last line; hyphens-auto and break-words
            keep a word longer than the column (e.g. "Decolonizing") from
            overflowing it. The document language is on <html>, which is what
            hyphenation resolves against. */}
        <Heading className="font-serif text-sm text-primary leading-snug text-balance hyphens-auto break-words">
          {withItalicQuotes(displayTitle)}
        </Heading>

        {action && <div className="mt-auto pt-4 flex justify-end">{action}</div>}
      </div>
    </div>
  );
}
