import { Download, ExternalLink, FileText, Play } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate, openFileInNewTab, youtubeThumbnailFallback } from "@/lib/payload";
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
 * alone in the first two of four columns. items-start rather than the
 * default stretch: a card whose preview carries its own aspect ratio can be a
 * different height than its row-mates, and stretch would pad the shorter
 * ones with blank space to match.
 */
export function PublicationCardGrid({ children }: { children: ReactNode }) {
  const { isArabic } = useLanguage();
  return (
    <div className="flex flex-wrap items-start justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
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
   * Pixel dimensions of `previewUrl`, when known. The well is sized to this
   * ratio so the image shows in full rather than being cropped into a shape
   * chosen for it. Falls back to a fixed document/clipping ratio when either
   * is missing — an upload made before Payload recorded dimensions.
   */
  previewWidth?: number;
  previewHeight?: number;
  /**
   * Shape of the preview well when its ratio isn't known. Documents fall back
   * to A4 proportions, clippings to something squarer, and `none` drops the
   * well for items carrying no media at all.
   */
  preview?: "document" | "clipping" | "none";
  /** Attached file — opened in a new tab, with a separate download action. */
  fileUrl?: string;
  /** The file's real type, so it can be made to preview in place — see
   * openFileInNewTab. */
  fileMimeType?: string;
  /** External destination (YouTube), which makes the thumbnail clickable and
   * swaps the file actions for a play button. */
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
  previewWidth,
  previewHeight,
  preview = "document",
  fileUrl,
  fileMimeType,
  linkUrl,
  as: Heading = "h3",
}: PublicationCardProps) {
  const { t, lang, isArabic } = useLanguage();
  const isAr = lang === "ar";
  const displayTitle = isAr ? (titleAr ?? title) : title;
  const displayAuthor = isAr ? (authorAr ?? author) : author;
  const watchLabel = isArabic ? "مشاهدة الفيديو" : "Watch video";
  const knownRatio = previewWidth && previewHeight ? previewWidth / previewHeight : undefined;

  const thumbnail = previewUrl ? (
    <img
      src={previewUrl}
      alt=""
      // Cover only stands in for a ratio we don't actually know; once the well
      // is sized to the image's own ratio there is nothing left to crop, and
      // contain guards the rare case where max-h below still clamps it.
      className={"w-full h-full " + (knownRatio ? "object-contain" : "object-cover object-top")}
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
    (knownRatio ? "" : preview === "clipping" ? "aspect-[3/4] " : "aspect-[1/1.41] ") +
    "max-h-[26rem] bg-secondary/20 overflow-hidden flex items-center justify-center";
  const wellStyle = knownRatio ? { aspectRatio: String(knownRatio) } : undefined;

  const actionButtonClass =
    "shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors";

  const action = linkUrl ? (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={watchLabel}
      title={watchLabel}
      className={actionButtonClass}
    >
      <Play className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" />
    </a>
  ) : fileUrl ? (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => openFileInNewTab(fileUrl, fileMimeType)}
        aria-label={t("publications.view")}
        title={t("publications.view")}
        className={actionButtonClass}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
      <a
        href={fileUrl}
        download
        aria-label={t("publications.download")}
        title={t("publications.download")}
        className={actionButtonClass}
      >
        <Download className="h-3.5 w-3.5" />
      </a>
    </div>
  ) : null;

  return (
    <div
      className={
        CARD_WIDTH +
        " border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
      }
    >
      {/* Video items open on YouTube; a file opens in a new tab from the same
          well its action button opens; anything else stays a plain well,
          since it carries no click of its own. */}
      {preview !== "none" &&
        (linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={watchLabel}
            className={"group block " + wellClass}
            style={wellStyle}
          >
            <div className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]">
              {thumbnail}
            </div>
          </a>
        ) : fileUrl ? (
          <button
            type="button"
            onClick={() => openFileInNewTab(fileUrl, fileMimeType)}
            aria-label={t("publications.view")}
            className={"group block w-full " + wellClass}
            style={wellStyle}
          >
            <div className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]">
              {thumbnail}
            </div>
          </button>
        ) : (
          <div className={wellClass} style={wellStyle}>
            {thumbnail}
          </div>
        ))}

      <div className="p-5 flex flex-col flex-1 text-start">
        {(date || displayAuthor) && (
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
            {date && <div>{formatDate(date, isAr ? "ar" : "en")}</div>}
            {displayAuthor && <div>{displayAuthor}</div>}
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
