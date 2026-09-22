import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus, X } from "lucide-react";
import { ForumAdditionalInfo, hasAdditionalInfo } from "./ForumAdditionalInfo";
import { RichText } from "./RichText";
import { TranslationNotice } from "./TranslationNotice";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import {
  formatDate,
  hasProse,
  mediaUrl,
  type ForumType,
  type PayloadActivity,
} from "@/lib/payload";

/**
 * The poster wall for Forums attached to a Research area, Task Force on AI,
 * Idea Factory, or Windsor-Birzeit.
 *
 * Each card used to be a link out to /activities/forums, which is a dated
 * ledger -- a different page, and a plainer one, than the posters that made
 * someone want to click. Pressing a poster now opens that same card in place:
 * it grows to the full width of the wall, showing the whole poster (a card
 * crops it, and the poster's own lettering carries the date and title), the
 * write-up and the photographs, and pressing it again shrinks it back.
 *
 * Cards take the shape of their image: a wide poster makes a wide card, an
 * upright one a tall card, so nothing is cropped into a box it doesn't fit.
 * Any number can be open at once -- opening one never closes another, so the
 * card under the visitor's finger doesn't move because of a different one.
 * Nothing changes places either: an open card stays where it is in the order,
 * and the cards after it in its row drop below it.
 */

/**
 * The type label goes through the translation dictionary like every other
 * label on the site, so wording changed in Site Settings (Forum Type: ...)
 * shows here too -- and the Forums page's filter tabs, which already work this
 * way, can't disagree with the cards.
 */
const FORUM_TYPE_LABEL_KEY: Record<ForumType, TranslationKey> = {
  seminar: "forums.type.seminar",
  roundtable: "forums.type.roundtable",
  workshop: "forums.type.workshop",
  conference: "forums.type.conference",
  encounters: "forums.type.encounters",
};

/** The largest an upright poster gets once its card is open, whatever its proportions. */
const POSTER_MAX_WIDTH = "26rem";
const POSTER_MAX_HEIGHT = "70vh";

/**
 * Width divided by height from which an image counts as wide. A wide image
 * makes a wide card, and once open runs across the top of the card with the
 * text beneath, instead of beside it: squeezed into a side column it shrank to
 * a thumbnail. Kept above 1 so a near-square image, which at full width would
 * be nearly as tall as it is wide, stays upright.
 */
const WIDE_MIN_RATIO = 1.2;

/** An upload from before Payload recorded dimensions is assumed to be an A-series page. */
const FALLBACK_RATIO = 1 / 1.41;

/**
 * A card's picture is shown at its own proportions, within limits: a very long
 * or very wide image is cropped a little rather than making a card that
 * dwarfs the rest of the wall.
 */
const CARD_MIN_RATIO = 0.5;
const CARD_MAX_RATIO = 2.5;

const NARROW_CARD_WIDTH = "w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]";
/** Two columns of the four -- and the whole row at two, where two is all there is. */
const WIDE_CARD_WIDTH = "w-full lg:w-[calc(50%-0.75rem)]";

/**
 * How many cards fit on a row, mirroring the widths the cards are given
 * (`sm:` two-up, `lg:` four-up). Cards are packed into rows in `packRows`,
 * which needs to know where a row ends.
 *
 * Starts at four: nothing is open during the server render, so the first
 * client render never disagrees with it.
 */
function useGridColumns(): number {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const sm = window.matchMedia("(min-width: 640px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const update = () => setColumns(lg.matches ? 4 : sm.matches ? 2 : 1);
    update();
    sm.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      sm.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);

  return columns;
}

function imageRatio(item: PayloadActivity): number {
  const { width, height } = item.image ?? {};
  return width && height ? width / height : FALLBACK_RATIO;
}

function isWide(item: PayloadActivity): boolean {
  return Boolean(mediaUrl(item.image)) && imageRatio(item) >= WIDE_MIN_RATIO;
}

/**
 * The cards split into rows of `columns`, wide ones counting as two. A wide
 * card that doesn't fit the space left on its row waits, and the next cards
 * that do fit close the row first, so no row is left short with a hole in the
 * middle of the wall. With nothing wide this is just the order the cards came
 * in.
 *
 * Depends only on the cards themselves, never on which are open: opening a
 * card must not change where any card is in the order.
 */
function packRows(items: PayloadActivity[], columns: number): PayloadActivity[][] {
  const queue = [...items];
  const rows: PayloadActivity[][] = [];
  let row: PayloadActivity[] = [];
  let filled = 0;
  let waiting: PayloadActivity[] = [];

  const closeRow = () => {
    if (row.length > 0) rows.push(row);
    row = [];
    filled = 0;
    // What was left waiting starts the next row.
    queue.unshift(...waiting);
    waiting = [];
  };

  while (queue.length > 0 || row.length > 0 || waiting.length > 0) {
    const item = queue.shift();
    if (!item) {
      closeRow();
      continue;
    }
    const span = isWide(item) ? Math.min(2, columns) : 1;
    if (filled + span > columns) {
      waiting.push(item);
      continue;
    }
    row.push(item);
    filled += span;
    if (filled === columns) closeRow();
  }

  return rows;
}

/** One line of the wall: a run of closed cards, or a single open card. */
type Line = { key: string; items: PayloadActivity[]; open: boolean; centered: boolean };

/**
 * Lines the wall is drawn in. An open card takes the whole width, so it cuts
 * its row in three: the cards before it, itself on a line of its own, and the
 * cards after it. Every card keeps its place in the order -- the ones after
 * it just drop below.
 *
 * Each line is its own row, left-aligned, so the cards before an open one stay
 * in the same columns they were in. Only the last row of the wall is centred
 * when it isn't full (a section with two entries would otherwise sit alone in
 * the first two of four columns), and not once an open card has cut it up.
 */
function buildLines(rows: PayloadActivity[][], openIds: Set<string>): Line[] {
  const lines: Line[] = [];

  rows.forEach((row, index) => {
    const start = lines.length;
    let run: PayloadActivity[] = [];
    const endRun = () => {
      if (run.length === 0) return;
      lines.push({ key: run[0].id, items: run, open: false, centered: false });
      run = [];
    };

    for (const item of row) {
      if (openIds.has(item.id)) {
        endRun();
        lines.push({ key: item.id, items: [item], open: true, centered: false });
      } else {
        run.push(item);
      }
    }
    endRun();

    const uncut = lines.length - start === 1 && !lines[start].open;
    if (index === rows.length - 1 && uncut) lines[start].centered = true;
  });

  return lines;
}

/**
 * Runs a change that moves cards around as a view transition, so each card
 * visibly grows out of, or shrinks back into, its own place instead of
 * jumping. Browsers without the API, and visitors who asked for reduced
 * motion, just get the change straight away. Resolves once the animation is
 * over, or at once when there isn't one.
 */
function withViewTransition(update: () => void): Promise<void> {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof document.startViewTransition !== "function") {
    update();
    return Promise.resolve();
  }
  // Scopes the styles in styles.css to this transition only.
  const root = document.documentElement;
  root.classList.add("forum-card-transition");
  const done = () => root.classList.remove("forum-card-transition");
  return document.startViewTransition(update).finished.then(done, done);
}

type Figure = { url: string; alt: string; caption?: string };

/** The photographs only -- the poster is shown separately, and larger. */
function galleryOf(item: PayloadActivity, isArabic: boolean): Figure[] {
  const figures: Figure[] = [];
  for (const entry of item.gallery ?? []) {
    const url = mediaUrl(entry.image);
    if (!url) continue;
    const caption = isArabic ? (entry.captionAr ?? entry.caption) : entry.caption;
    figures.push({ url, alt: entry.image?.alt ?? "", caption: caption?.trim() || undefined });
  }
  return figures;
}

function typeLabelOf(item: PayloadActivity, t: (key: TranslationKey) => string): string | null {
  return item.forumType ? t(FORUM_TYPE_LABEL_KEY[item.forumType]) : null;
}

/** Plus mark on a card's corner: says the card opens. */
function ToggleChip() {
  return (
    <span
      aria-hidden="true"
      className="grid h-8 w-8 place-items-center rounded-full border border-border bg-background/95 text-primary shadow-sm transition-colors duration-300 group-hover:border-[color:var(--brand-magenta)] group-hover:text-[color:var(--brand-magenta)]"
    >
      <Plus className="h-4 w-4" />
    </span>
  );
}

/**
 * A card is only pressable when there is something to open: a poster, a
 * write-up (even one only written in the other language, which opens to say
 * so), photographs, or anything under Additional Information. One with none
 * of those is a line of text, not a control.
 */
function isExpandable(item: PayloadActivity): boolean {
  return (
    Boolean(mediaUrl(item.image)) ||
    hasProse(item.content) ||
    hasProse(item.contentAr) ||
    (item.gallery ?? []).some((entry) => mediaUrl(entry.image)) ||
    hasAdditionalInfo(item)
  );
}

function ForumCardClosed({
  item,
  onToggle,
  cardRef,
}: {
  item: PayloadActivity;
  onToggle: () => void;
  cardRef: (el: HTMLElement | null) => void;
}) {
  const { t, lang, isArabic } = useLanguage();
  const displayTitle = lang === "ar" ? (item.titleAr ?? item.title) : item.title;
  const typeLabel = typeLabelOf(item, t);
  const image = mediaUrl(item.image);
  const expandable = isExpandable(item);
  const cardRatio = Math.min(Math.max(imageRatio(item), CARD_MIN_RATIO), CARD_MAX_RATIO);

  const content = (
    <>
      {image && (
        // The picture at its own proportions, so the card is as wide or as
        // tall as the poster is. The ratio is set up front so the wall doesn't
        // jump as pictures load.
        <div
          className="relative overflow-hidden bg-secondary/20"
          style={{ aspectRatio: cardRatio }}
        >
          <img src={image} alt="" className="h-full w-full object-cover object-top" />
          {expandable && (
            <span className="absolute bottom-2.5 end-2.5">
              <ToggleChip />
            </span>
          )}
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        {(item.date || typeLabel) && (
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
            {item.date && <div>{formatDate(item.date, isArabic ? "ar" : "en")}</div>}
            {typeLabel && <div className="text-[color:var(--brand-magenta)]">{typeLabel}</div>}
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-serif text-sm text-primary leading-snug text-balance hyphens-auto break-words">
            {displayTitle}
          </h4>
          {/* No poster to sit on, so the chip joins the title instead. */}
          {!image && expandable && <ToggleChip />}
        </div>
      </div>
    </>
  );

  const cardClass =
    (isWide(item) ? WIDE_CARD_WIDTH : NARROW_CARD_WIDTH) +
    " border border-border rounded-sm bg-card overflow-hidden flex flex-col text-start transition-shadow";
  const style = { viewTransitionName: `forum-card-${item.id}` } as CSSProperties;

  if (!expandable) {
    return (
      <div ref={cardRef} className={cardClass} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onToggle}
      aria-expanded={false}
      className={
        cardClass +
        " group scroll-mt-28 cursor-pointer hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-magenta)] focus-visible:ring-offset-2"
      }
      style={style}
    >
      {content}
    </button>
  );
}

/** The same card, opened: the whole width of the wall, the whole poster, the write-up. */
function ForumCardOpen({
  item,
  onToggle,
  cardRef,
}: {
  item: PayloadActivity;
  onToggle: () => void;
  cardRef: (el: HTMLElement | null) => void;
}) {
  const { t, lang, isArabic } = useLanguage();
  const title = lang === "ar" ? (item.titleAr ?? item.title) : item.title;
  const typeLabel = typeLabelOf(item, t);

  const poster = mediaUrl(item.image);
  // Width that makes an upright poster exactly `POSTER_MAX_HEIGHT` tall (or
  // the cap, if that is narrower), from the proportions Payload recorded at
  // upload.
  const posterWidth = `min(${POSTER_MAX_WIDTH}, calc(${POSTER_MAX_HEIGHT} * ${imageRatio(item).toFixed(4)}))`;
  const wide = isWide(item);
  const beside = Boolean(poster) && !wide;

  // Prose is the visitor's own language only, matching the ledger: an entry
  // written up only in the other language says so rather than serving it.
  const body = lang === "ar" ? item.contentAr : item.content;
  const untranslated = !hasProse(body) && hasProse(lang === "ar" ? item.content : item.contentAr);
  const gallery = galleryOf(item, isArabic);

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      role="region"
      aria-label={title}
      onKeyDown={(event) => {
        if (event.key === "Escape") onToggle();
      }}
      className="relative w-full scroll-mt-28 scroll-mb-6 overflow-hidden rounded-sm border border-border border-t-2 border-t-[color:var(--brand-magenta)] bg-card text-start focus:outline-none"
      style={
        {
          viewTransitionName: `forum-card-${item.id}`,
          "--poster-width": posterWidth,
        } as CSSProperties
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={isArabic ? "إغلاق" : "Close"}
        className="absolute end-3 top-3 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm transition-colors hover:border-[color:var(--brand-magenta)] hover:text-[color:var(--brand-magenta)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-magenta)]"
      >
        <X className="h-4 w-4" />
      </button>

      {/* The image is flush with the card's edges, no margin around it, and
          always shown whole. A wide one runs the full width across the top
          with the text beneath. An upright one sits beside the text, at the
          start edge (left in English, right in Arabic -- the grid follows the
          page direction), sized from its own proportions: as wide as
          `POSTER_MAX_WIDTH`, but never taller than `POSTER_MAX_HEIGHT` of the
          window, since at the card's full width it would be taller than the
          screen. */}
      <div className={beside ? "md:grid md:grid-cols-[var(--poster-width)_minmax(0,1fr)]" : ""}>
        {poster && (
          <div className={wide ? "" : "bg-secondary/20"}>
            <img
              src={poster}
              alt={item.image?.alt || title}
              className="block h-auto w-full object-contain"
              style={wide ? undefined : { maxHeight: POSTER_MAX_HEIGHT }}
            />
          </div>
        )}

        {/* The text sits in the middle of whatever room the image leaves --
            centred across the card under a wide image, and centred against the
            poster's height beside an upright one -- rather than pressed against
            one edge with the rest left empty. */}
        <div
          className={
            "min-w-0 p-5 md:p-8 " + (beside ? "md:flex md:flex-col md:justify-center" : "")
          }
        >
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {/* Clear of the close button's corner. */}
            <div className="pe-10">
              {(item.date || typeLabel) && (
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {item.date && <span>{formatDate(item.date, isArabic ? "ar" : "en")}</span>}
                  {item.date && typeLabel && <span aria-hidden="true"> · </span>}
                  {typeLabel && (
                    <span className="text-[color:var(--brand-magenta)]">{typeLabel}</span>
                  )}
                </div>
              )}
              <h4 className="font-serif text-xl leading-snug text-primary md:text-2xl">{title}</h4>
            </div>

            {hasProse(body) && (
              <RichText
                value={body}
                className="space-y-4 text-sm leading-relaxed text-foreground"
              />
            )}
            {untranslated && <TranslationNotice />}

            {gallery.length > 0 && (
              <div
                className={
                  "grid gap-3 " +
                  (gallery.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-2 lg:grid-cols-3")
                }
              >
                {gallery.map((figure, index) => (
                  <figure key={`${figure.url}-${index}`}>
                    <div className="overflow-hidden rounded-sm border border-border bg-secondary/40">
                      <img
                        src={figure.url}
                        alt={figure.alt}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                    {figure.caption && (
                      <figcaption className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                        {figure.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}

            <ForumAdditionalInfo item={item} />

            <Link
              to="/activities/forums"
              search={{ type: item.forumType, open: item.id }}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-[color:var(--brand-magenta)]"
            >
              {isArabic ? "افتح في المنتديات" : "Open in Forums"}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForumGrid({ items }: { items: PayloadActivity[] }) {
  const { isArabic } = useLanguage();
  const columns = useGridColumns();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const cardElements = useRef(new Map<string, HTMLElement>());

  const toggle = (id: string) => {
    const opening = !openIds.has(id);
    void withViewTransition(() => {
      flushSync(() =>
        setOpenIds((current) => {
          const next = new Set(current);
          if (opening) next.add(id);
          else next.delete(id);
          return next;
        }),
      );
      // The card that was pressed is replaced by its other form, so focus has
      // to be handed across or it would be left on a node that is gone.
      cardElements.current.get(id)?.focus({ preventScroll: true });
    }).then(() => {
      // An opened card grows downward, so it can end up below the fold, where
      // pressing a card would appear to do nothing.
      if (!opening) return;
      const element = cardElements.current.get(id);
      if (!element) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // A card taller than the window has no good "nearest": start at its top.
      const taller = element.getBoundingClientRect().height > window.innerHeight;
      element.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: taller ? "start" : "nearest",
      });
    });
  };

  const rows = useMemo(() => packRows(items, columns), [items, columns]);

  const cardProps = (item: PayloadActivity) => ({
    item,
    onToggle: () => toggle(item.id),
    cardRef: (el: HTMLElement | null) => {
      if (el) cardElements.current.set(item.id, el);
      else cardElements.current.delete(item.id);
    },
  });

  return (
    <div className="flex flex-col gap-6" dir={isArabic ? "rtl" : "ltr"}>
      {buildLines(rows, openIds).map((line) =>
        line.open ? (
          <ForumCardOpen key={line.key} {...cardProps(line.items[0])} />
        ) : (
          <div
            key={line.key}
            className={
              "flex flex-wrap items-start gap-6 " + (line.centered ? "justify-center" : "")
            }
          >
            {line.items.map((item) => (
              <ForumCardClosed key={item.id} {...cardProps(item)} />
            ))}
          </div>
        ),
      )}
    </div>
  );
}
