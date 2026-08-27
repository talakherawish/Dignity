import { Link } from "@tanstack/react-router";
import { Download, ExternalLink, FileText, Play } from "lucide-react";
import { useState, type ReactNode } from "react";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatDate,
  isYoutubeLink,
  openFileInNewTab,
  resolveAttachment,
  youtubeEmbedUrl,
  youtubeThumbnailFallback,
} from "@/lib/payload";
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

/**
 * Width for a YouTube video card — a 16:9 thumbnail squeezed into the
 * 25%-wide document column reads tiny and cropped. Staying two-up at every
 * breakpoint from `sm` keeps the well close to a real YouTube thumbnail's
 * size. `linkUrl` can also hold a non-video external link (a Paper's journal
 * page, say), which stays at the narrower `CARD_WIDTH` — only a detected
 * YouTube URL gets the wide treatment.
 */
const VIDEO_CARD_WIDTH = "w-full sm:w-[calc(50%-0.75rem)]";

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

/** A tagged author -- picked from Participants in the admin rather than typed. */
export type PublicationCardAuthor = { id: string; name: string; nameAr?: string };

export type PublicationCardProps = {
  title: string;
  titleAr?: string;
  author?: string;
  authorAr?: string;
  /** Takes precedence over `author`/`authorAr` when non-empty -- see the field's own admin description on Publications.ts. */
  authorParticipants?: PublicationCardAuthor[];
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
  /** Arabic-only counterpart to `fileUrl`, when the two differ — see resolveAttachment. */
  fileUrlAr?: string;
  fileMimeTypeAr?: string;
  /** External destination (YouTube), which makes the thumbnail clickable and
   * swaps the file actions for a play button. */
  linkUrl?: string;
  /** Arabic-only counterpart to `linkUrl`, when the two differ. */
  linkUrlAr?: string;
  /** Headings inside a section that already has its own h3 pass "h4". */
  as?: "h3" | "h4";
};

export function PublicationCard({
  title,
  titleAr,
  author,
  authorAr,
  authorParticipants,
  date,
  previewUrl,
  previewWidth,
  previewHeight,
  preview = "document",
  fileUrl,
  fileMimeType,
  fileUrlAr,
  fileMimeTypeAr,
  linkUrl,
  linkUrlAr,
  as: Heading = "h3",
}: PublicationCardProps) {
  const { t, lang, isArabic } = useLanguage();
  const isAr = lang === "ar";
  // Whether a video's embedded player has been started in place of its
  // thumbnail -- see the well markup below. Per-card local state, since only
  // the card the visitor clicked should start playing.
  const [isPlaying, setIsPlaying] = useState(false);
  const displayTitle = isAr ? (titleAr ?? title) : title;
  const displayAuthor = isAr ? (authorAr ?? author) : author;
  // Participants picked in the admin win over a typed name -- see the field's
  // own admin description on Publications.ts ("either write them by hand or
  // pick them from the list").
  const authorTags =
    authorParticipants && authorParticipants.length > 0
      ? authorParticipants.map((p) => ({ id: p.id, name: isAr ? (p.nameAr ?? p.name) : p.name }))
      : undefined;
  const watchLabel = isArabic ? "مشاهدة الفيديو" : "Watch video";
  const watchOnYoutubeLabel = t("publications.watchOnYoutube");

  // File and link are independent per language (see resolveAttachment): a
  // plain value with no Arabic counterpart is shared across both languages,
  // while an Arabic-only value means an English reader sees a fallback notice
  // instead of the action row.
  const resolvedLink = resolveAttachment(linkUrl, linkUrlAr, isAr);
  const resolvedFile = resolveAttachment(fileUrl, fileUrlAr, isAr);
  const resolvedFileMimeType = isAr && fileUrlAr ? fileMimeTypeAr : fileMimeType;
  linkUrl = resolvedLink.value;
  fileUrl = resolvedFile.value;
  const attachmentMissing = !linkUrl && !fileUrl && (resolvedLink.missing || resolvedFile.missing);

  const isVideo = isYoutubeLink(linkUrl);
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
    (knownRatio
      ? ""
      : isVideo
        ? "aspect-video "
        : preview === "clipping"
          ? "aspect-[3/4] "
          : "aspect-[1/1.41] ") +
    "max-h-[26rem] bg-secondary/20 overflow-hidden flex items-center justify-center";
  const wellStyle = knownRatio ? { aspectRatio: String(knownRatio) } : undefined;

  const actionButtonClass =
    "shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors";

  // For a video, the well itself plays the video in place (below) -- this
  // button is the escape hatch to watch on youtube.com proper instead. A
  // non-video link (e.g. a Paper's journal page) has no embedded form, so it
  // keeps the older "this button is the only way there" Play affordance.
  const action = linkUrl ? (
    isVideo ? (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={watchOnYoutubeLabel}
        title={watchOnYoutubeLabel}
        className={actionButtonClass}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    ) : (
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
    )
  ) : fileUrl ? (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => openFileInNewTab(fileUrl, resolvedFileMimeType)}
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
        (isVideo ? VIDEO_CARD_WIDTH : CARD_WIDTH) +
        " border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
      }
    >
      {/* A video plays inline in place of its thumbnail once clicked, rather
          than only ever sending the visitor away to youtube.com (that's what
          the action button below is for). A non-video link opens on its own
          site; a file opens in a new tab from the same well its action
          button opens; anything else stays a plain well, since it carries no
          click of its own. */}
      {preview !== "none" &&
        (isVideo && isPlaying ? (
          <div className={wellClass} style={wellStyle}>
            <iframe
              src={youtubeEmbedUrl(linkUrl)}
              title={displayTitle}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : isVideo && linkUrl ? (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label={watchLabel}
            className={"group relative block w-full " + wellClass}
            style={wellStyle}
          >
            <div className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]">
              {thumbnail}
            </div>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center h-12 w-12 rounded-full bg-black/60 text-white transition-colors group-hover:bg-black/75">
                <Play className="h-5 w-5 translate-x-[1px]" fill="currentColor" />
              </span>
            </span>
          </button>
        ) : linkUrl ? (
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
            onClick={() => openFileInNewTab(fileUrl, resolvedFileMimeType)}
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
        {(date || displayAuthor || authorTags) && (
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
            {date && <div>{formatDate(date, isAr ? "ar" : "en")}</div>}
            {/* normal-case: a person's name isn't a label like the date above
                it -- shouting it in caps reads as wrong, not stylised. */}
            {authorTags ? (
              <div className="normal-case">
                {authorTags.map((tag, index) => (
                  <span key={tag.id}>
                    <Link
                      to="/about/participants"
                      search={{ participant: tag.id }}
                      className="hover:text-accent hover:underline underline-offset-2"
                    >
                      {tag.name}
                    </Link>
                    {index < authorTags.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            ) : (
              displayAuthor && <div className="normal-case">{displayAuthor}</div>
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

        {action ? (
          <div className="mt-auto pt-4 flex justify-end">{action}</div>
        ) : (
          attachmentMissing && <TranslationNotice compact className="mt-auto pt-4 text-end" />
        )}
      </div>
    </div>
  );
}
