import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus, X } from "lucide-react";
import { PublicationCardGrid } from "./PublicationCard";
import { RichText } from "./RichText";
import { TranslationNotice } from "./TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatDate,
  hasProse,
  mediaUrl,
  type ForumType,
  type PayloadActivity,
} from "@/lib/payload";

/**
 * The poster wall for Forums attached to a Research area, Task Force on AI, or
 * Idea Factory.
 *
 * Each card used to be a link out to /activities/forums, which is a dated
 * ledger -- a different page, and a plainer one, than the posters that made
 * someone want to click. Pressing a poster now opens a drawer directly under
 * its row instead: the whole poster (the card crops it into a fixed box, and
 * the poster's own lettering carries the date and title), the write-up at a
 * readable width, and the photographs. The grid above and below never
 * reflows, and only one drawer is open at a time.
 */

const FORUM_TYPE_LABEL: Record<ForumType, { en: string; ar: string }> = {
  seminar: { en: "Seminar", ar: "ندوة" },
  roundtable: { en: "Roundtable", ar: "طاولة مستديرة" },
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  conference: { en: "Conference", ar: "مؤتمر" },
  encounters: { en: "Encounters", ar: "حواريات" },
};

/** Long enough for the close transition below to finish before the drawer unmounts. */
const DRAWER_TRANSITION_MS = 500;

/**
 * How many cards fit on a row, mirroring the widths the cards are given
 * (`sm:` two-up, `lg:` four-up). The drawer has to be placed after the last
 * card of the row it belongs to, so it needs to know where rows break.
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

/** Plus that turns into a cross. */
function ToggleChip({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "grid h-8 w-8 place-items-center rounded-full border bg-background/95 shadow-sm transition-colors duration-300 " +
        (open
          ? "border-[color:var(--brand-magenta)] text-[color:var(--brand-magenta)]"
          : "border-border text-primary group-hover:border-[color:var(--brand-magenta)] group-hover:text-[color:var(--brand-magenta)]")
      }
    >
      <Plus
        className={
          "h-4 w-4 transition-transform duration-300 motion-reduce:transition-none " +
          (open ? "rotate-45" : "")
        }
      />
    </span>
  );
}

/**
 * A card is only pressable when there is something to open: a poster, a
 * write-up (even one only written in the other language, which opens to say
 * so), or photographs. One with none of those is a line of text, not a
 * control.
 */
function isExpandable(item: PayloadActivity): boolean {
  return (
    Boolean(mediaUrl(item.image)) ||
    hasProse(item.content) ||
    hasProse(item.contentAr) ||
    (item.gallery ?? []).some((entry) => mediaUrl(entry.image))
  );
}

function ForumCard({
  item,
  open,
  panelId,
  onToggle,
  cardRef,
}: {
  item: PayloadActivity;
  /** This card's drawer is the one currently open. */
  open: boolean;
  panelId?: string;
  onToggle: () => void;
  cardRef: (el: HTMLElement | null) => void;
}) {
  const { lang, isArabic } = useLanguage();
  const displayTitle = lang === "ar" ? (item.titleAr ?? item.title) : item.title;
  const typeLabel = item.forumType
    ? isArabic
      ? FORUM_TYPE_LABEL[item.forumType].ar
      : FORUM_TYPE_LABEL[item.forumType].en
    : null;
  const image = mediaUrl(item.image);
  const expandable = isExpandable(item);

  const chip = expandable ? <ToggleChip open={open} /> : null;

  const content = (
    <>
      {image && (
        <div className="relative aspect-[1/1.41] max-h-[26rem] bg-secondary/20 overflow-hidden">
          <img src={image} alt="" className="w-full h-full object-cover object-top" />
          {chip && <span className="absolute bottom-2.5 end-2.5">{chip}</span>}
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
          {!image && chip}
        </div>
      </div>
    </>
  );

  const cardClass =
    "w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border rounded-sm bg-card overflow-hidden flex flex-col text-start transition-shadow ";

  if (!expandable) {
    return (
      <div ref={cardRef} className={cardClass + "border-border"}>
        {content}
      </div>
    );
  }

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={panelId}
      className={
        cardClass +
        "group cursor-pointer hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-magenta)] focus-visible:ring-offset-2 " +
        (open ? "border-[color:var(--brand-magenta)] shadow-sm" : "border-border")
      }
    >
      {content}
    </button>
  );
}

function ForumDrawer({
  item,
  open,
  panelId,
  onClose,
  panelRef,
}: {
  item: PayloadActivity;
  /** False while the drawer is closing; it unmounts once the transition has run. */
  open: boolean;
  panelId: string;
  onClose: () => void;
  panelRef: (el: HTMLDivElement | null) => void;
}) {
  const { lang, isArabic } = useLanguage();
  const title = lang === "ar" ? (item.titleAr ?? item.title) : item.title;
  const typeLabel = item.forumType
    ? isArabic
      ? FORUM_TYPE_LABEL[item.forumType].ar
      : FORUM_TYPE_LABEL[item.forumType].en
    : null;

  const poster = mediaUrl(item.image);

  // Prose is the visitor's own language only, matching the ledger: an entry
  // written up only in the other language says so rather than serving it.
  const body = lang === "ar" ? item.contentAr : item.content;
  const untranslated = !hasProse(body) && hasProse(lang === "ar" ? item.content : item.contentAr);
  const gallery = galleryOf(item, isArabic);

  // Mounted collapsed, then opened a frame later: a panel that first appears
  // already at full height has nothing to transition from. Two frames, because
  // the first can run before the browser has laid out the collapsed state.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  const expanded = entered && open;

  return (
    <div
      ref={panelRef}
      id={panelId}
      role="region"
      aria-label={title}
      inert={!expanded}
      className={
        "grid w-full scroll-mt-28 scroll-mb-6 transition-[grid-template-rows] ease-out motion-reduce:transition-none " +
        (expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
      }
      style={{ transitionDuration: `${DRAWER_TRANSITION_MS}ms` }}
    >
      <div className="overflow-hidden">
        {/* Keyed so pressing another card in the same row, which reuses this
            drawer, fades its new contents in rather than swapping them cold. */}
        <div
          key={item.id}
          className="relative overflow-hidden rounded-sm border border-border border-t-2 border-t-[color:var(--brand-magenta)] bg-card opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={isArabic ? "إغلاق" : "Close"}
            className="absolute end-3 top-3 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm transition-colors hover:border-[color:var(--brand-magenta)] hover:text-[color:var(--brand-magenta)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-magenta)]"
          >
            <X className="h-4 w-4" />
          </button>

          {/* The poster runs the full width of the drawer, edge to edge: its own
              lettering carries the date and title, so it is shown as large as
              the drawer allows rather than boxed into a column. */}
          {poster && (
            <img src={poster} alt={item.image?.alt || title} className="block h-auto w-full" />
          )}

          {/* A line length that reads, however wide the drawer is. */}
          <div
            className={
              "min-w-0 max-w-3xl space-y-6 p-5 md:p-8 " +
              // With no poster, the close button sits over this block instead.
              (poster ? "" : "pe-14 md:pe-16")
            }
          >
            <div>
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
  const columns = useGridColumns();
  // What the visitor has asked to be open, and what is mounted. They differ
  // only while a drawer is closing: it stays mounted, collapsing, until the
  // transition has run.
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const cardElements = useRef(new Map<string, HTMLElement>());
  const drawerElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (openId !== null) return;
    const timer = setTimeout(() => setDrawerId(null), DRAWER_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [openId]);

  // The drawer can open below the fold, where pressing a card would appear to
  // do nothing. Waits for it to reach full height so "nearest" measures the
  // real thing.
  useEffect(() => {
    if (openId === null) return;
    const timer = setTimeout(() => {
      const element = drawerElement.current;
      if (!element) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // A full-width poster can make the drawer taller than the window, and
      // "nearest" has no good answer for that: start at the top of it.
      const taller = element.getBoundingClientRect().height > window.innerHeight;
      element.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: taller ? "start" : "nearest",
      });
    }, DRAWER_TRANSITION_MS + 20);
    return () => clearTimeout(timer);
  }, [openId]);

  const open = (id: string) => {
    setOpenId(id);
    setDrawerId(id);
  };

  const close = () => {
    const id = openId;
    setOpenId(null);
    // Closing from inside the drawer (its button, or Esc) would otherwise drop
    // focus on a node that is about to unmount.
    if (id) cardElements.current.get(id)?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (openId === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // `close` only reads `openId`, which is already this effect's dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  // The drawer belongs after the last card of the row holding the open one.
  const drawerIndex = items.findIndex((item) => item.id === drawerId);
  const drawerAfter =
    drawerIndex < 0
      ? -1
      : Math.min((Math.floor(drawerIndex / columns) + 1) * columns, items.length) - 1;
  const drawerItem = drawerIndex < 0 ? null : items[drawerIndex];

  return (
    <PublicationCardGrid>
      {items.map((item, index) => (
        <Fragment key={item.id}>
          <ForumCard
            item={item}
            open={openId === item.id}
            panelId={drawerId === item.id ? `forum-drawer-${item.id}` : undefined}
            onToggle={() => (openId === item.id ? close() : open(item.id))}
            cardRef={(el) => {
              if (el) cardElements.current.set(item.id, el);
              else cardElements.current.delete(item.id);
            }}
          />
          {drawerItem && index === drawerAfter && (
            <ForumDrawer
              item={drawerItem}
              open={openId !== null}
              panelId={`forum-drawer-${drawerItem.id}`}
              onClose={close}
              panelRef={(el) => {
                drawerElement.current = el;
              }}
            />
          )}
        </Fragment>
      ))}
    </PublicationCardGrid>
  );
}
