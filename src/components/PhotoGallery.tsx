import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatDate,
  mediaUrl,
  populated,
  type ForumType,
  type PayloadParticipant,
  type PayloadPhoto,
} from "@/lib/payload";

/**
 * The photo gallery, shared by the Photos page and a research entry's photos.
 *
 * Both pages used to force every photo into a fixed box — 16:9 on the Photos
 * page, a square on the research page — and crop to fill it with
 * `object-cover`. A portrait shot lost its top and bottom; a wide group photo
 * lost its edges.
 *
 * This is a justified layout instead, the Flickr/Google Photos arrangement:
 * every photo in a row is drawn at the same height, each one as wide as its own
 * proportions make it, and the row is scaled until it exactly fills the width.
 * Nothing is cropped, and nothing is forced to a shape it isn't.
 *
 * The rows are worked out here rather than left to flexbox. A pure
 * `flex-grow`/`flex-basis` version justifies a full row correctly, but has no
 * way to bound a row that ends up underfull: a single wide panorama that
 * wouldn't fit beside its neighbours gets stretched across the whole width, and
 * a 3:1 photo then stands 590px tall next to 269px rows. Packing the rows
 * ourselves lets an underfull row keep the target height and simply end early,
 * which is what every real justified gallery does.
 *
 * Payload records the pixel dimensions of every upload, so the ratios are known
 * before a single image has loaded — the layout is right on first paint and
 * never reflows as images arrive.
 */

export type GalleryPhoto = {
  id: string;
  url: string;
  /** Optional — an untitled photo simply shows no caption. */
  caption?: string;
  date?: string;
  width?: number;
  height?: number;
  /**
   * The Forums activity (seminar, roundtable, workshop, conference) this
   * photo is from, if one was linked in the admin. Shown in the lightbox as
   * an "Enter" link to that activity, already resolved to the visitor's
   * language by the caller.
   */
  activity?: { id: string; title: string; forumType?: ForumType };
  /**
   * People tagged in this photo, if any. Shown in the lightbox as clickable
   * tags linking to each person's profile under About → Participants,
   * already resolved to the visitor's language by the caller.
   */
  people?: { id: string; name: string }[];
};

/**
 * Turns a Photos collection document into what this gallery renders,
 * resolving its optional related-activity and tagged-people relations into
 * the visitor's language. Shared by the standalone Photos page and a
 * research entry's photos, which both draw from the same collection.
 */
export function toGalleryPhoto(photo: PayloadPhoto, lang: "en" | "ar"): GalleryPhoto {
  const caption = lang === "ar" ? (photo.titleAr ?? photo.title) : photo.title;

  const relatedActivity =
    typeof photo.relatedActivity === "object" && photo.relatedActivity
      ? photo.relatedActivity
      : undefined;
  const activity = relatedActivity
    ? {
        id: relatedActivity.id,
        title:
          lang === "ar"
            ? (relatedActivity.titleAr ?? relatedActivity.title)
            : relatedActivity.title,
        forumType: relatedActivity.forumType,
      }
    : undefined;

  const people = populated<PayloadParticipant>(photo.taggedParticipants).map((person) => ({
    id: person.id,
    name: lang === "ar" ? (person.nameAr ?? person.name) : person.name,
  }));

  return {
    id: photo.id,
    url: mediaUrl(photo.image),
    caption: caption || undefined,
    date: photo.date,
    width: photo.image?.width,
    height: photo.image?.height,
    activity,
    people: people.length > 0 ? people : undefined,
  };
}

/** Landscape-ish, used when an upload predates Payload recording dimensions. */
const FALLBACK_RATIO = 1.5;

const GAP = 0;

function aspectRatio(photo: GalleryPhoto): number {
  if (!photo.width || !photo.height) return FALLBACK_RATIO;
  const ratio = photo.width / photo.height;
  // A panorama would otherwise demand a row to itself and shrink to a sliver;
  // a very tall image would tower over its neighbours.
  return Math.min(Math.max(ratio, 0.5), 3);
}

/**
 * Shorter rows on smaller screens, so a phone still fits a photo comfortably.
 *
 * Every photo in a row shares this height, and its width is just height ×
 * its own ratio -- so a square photo (ratio 1) is always the narrowest thing
 * in any row next to wider ones, and reads as noticeably smaller. Raising
 * the shared height is what makes it (and everything else) bigger without
 * cropping or distorting anyone's proportions.
 */
function targetRowHeight(containerWidth: number): number {
  if (containerWidth < 480) return 190;
  if (containerWidth < 900) return 260;
  return 320;
}

type PackedRow = {
  items: { photo: GalleryPhoto; ratio: number }[];
  height: number;
  /** False for a trailing row too empty to fill the width without ballooning. */
  justified: boolean;
};

/**
 * Row packing: add photos to a row until scaling it to fill the width would
 * drop it to the target height, then commit whichever of "stop one photo
 * earlier" or "include this one" lands closer to that target — rather than
 * always taking the first point that crosses under it.
 *
 * That second part matters more than it looks: two photos wide enough on
 * their own (a couple of panorama-ish shots, ratio 3 apiece) cross under
 * *any* reasonable target the moment the second one joins the row, landing
 * the row well below target regardless of how high the target is raised —
 * committing after just the first of them, alone, would have overshot
 * *above* target by less. A plain "stop as soon as we're under" rule can
 * therefore end up producing the exact same row for a raised target as for
 * the old one, which is what made an earlier version of this fix invisible
 * on rows led by a wide photo.
 *
 * `height = (width - gaps) / sum(ratios)` is just the justification identity —
 * with every photo at height h, the row measures `h * sum(ratios) + gaps`, so
 * solving for a row that measures the container width gives h.
 */
function packRows(
  photos: GalleryPhoto[],
  containerWidth: number,
  targetHeight: number,
): PackedRow[] {
  const rows: PackedRow[] = [];
  let current: { photo: GalleryPhoto; ratio: number }[] = [];
  let ratioSum = 0;

  for (const photo of photos) {
    const ratio = aspectRatio(photo);
    const nextRatioSum = ratioSum + ratio;
    const heightWithPhoto = (containerWidth - current.length * GAP) / nextRatioSum;

    if (heightWithPhoto <= targetHeight && current.length > 0) {
      const heightWithout = (containerWidth - (current.length - 1) * GAP) / ratioSum;
      if (Math.abs(heightWithout - targetHeight) < Math.abs(heightWithPhoto - targetHeight)) {
        // Closer without this photo: commit what's there, start fresh with it.
        rows.push({ items: current, height: heightWithout, justified: true });
        current = [{ photo, ratio }];
        ratioSum = ratio;
        continue;
      }
    }

    current.push({ photo, ratio });
    ratioSum = nextRatioSum;
    if (heightWithPhoto <= targetHeight) {
      rows.push({ items: current, height: heightWithPhoto, justified: true });
      current = [];
      ratioSum = 0;
    }
  }

  if (current.length > 0) {
    // The leftovers. Filling the width would blow them up past every row above,
    // so they keep the target height and the row simply ends short.
    const exact = (containerWidth - (current.length - 1) * GAP) / ratioSum;
    rows.push({
      items: current,
      height: Math.min(exact, targetHeight),
      justified: exact <= targetHeight,
    });
  }

  return rows;
}

/** useLayoutEffect measures before paint, but only the browser has a layout. */
const useMeasureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const { lang, isArabic } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Rows depend on the width available, so they are recomputed when it changes.
  // Two signals rather than one: the observer catches changes the window never
  // sees — a scrollbar appearing once the gallery makes the page tall enough to
  // need one takes ~15px off the container — and the resize listener is a cheap
  // guard for anywhere the observer doesn't deliver.
  useMeasureEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setContainerWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length,
      ),
    [photos.length],
  );

  // Arrow keys and Escape while the lightbox is open. Bound to the document so
  // it works without the overlay holding focus, and only while one is open.
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      // In RTL the left arrow points at the next photo, not the previous one.
      if (event.key === "ArrowRight") step(isArabic ? -1 : 1);
      if (event.key === "ArrowLeft") step(isArabic ? 1 : -1);
    };
    document.addEventListener("keydown", onKey);
    // The page behind the lightbox shouldn't scroll under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step, isArabic]);

  const open = openIndex === null ? null : photos[openIndex];

  // Before the first measurement there is no width to justify against, so the
  // gallery renders nothing rather than a wrong layout that visibly resettles.
  // The measurement runs before paint, so this is never seen.
  const rows =
    containerWidth > 0 ? packRows(photos, containerWidth, targetRowHeight(containerWidth)) : [];
  const indexOf = new Map(photos.map((photo, index) => [photo.id, index]));

  return (
    <>
      <div ref={containerRef} dir={isArabic ? "rtl" : "ltr"}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex"
            style={{ gap: GAP, marginBottom: rowIndex === rows.length - 1 ? 0 : GAP }}
          >
            {row.items.map(({ photo, ratio }) => {
              const index = indexOf.get(photo.id) ?? 0;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  aria-label={photo.caption || (isArabic ? "عرض الصورة" : "View photo")}
                  style={
                    row.justified
                      ? // Sized by the browser, not by our measurement: widths
                        // divide the row in proportion to the ratios, and
                        // aspect-ratio turns each width back into the same
                        // height. The row therefore fills its container exactly
                        // however wide it really is — so a scrollbar appearing
                        // after we measured shifts nothing.
                        { flexGrow: ratio, flexBasis: 0, aspectRatio: ratio }
                      : // A trailing row keeps the target height and stops
                        // short rather than stretching to fill.
                        { width: row.height * ratio, height: row.height, flex: "none" }
                  }
                  className="group relative block overflow-hidden bg-secondary/20 cursor-zoom-in"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    // The box is already the photo's own shape, so `cover`
                    // has nothing to crop — it only guards the rare upload
                    // whose recorded dimensions disagree with the file.
                    className="block w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {(photo.caption || photo.date) && (
                    // Over the photo rather than beneath it: text in the flow
                    // would add its own height to the item and break the very
                    // row alignment this layout exists to produce. Hidden until
                    // hover, so the gallery reads as pictures first.
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 text-start opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {photo.caption && (
                        <span className="block text-xs font-medium leading-snug text-white">
                          {photo.caption}
                        </span>
                      )}
                      {photo.date && (
                        <span className="mt-0.5 block text-[11px] text-white/70">
                          {formatDate(photo.date, lang === "ar" ? "ar" : "en")}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={open.caption || (isArabic ? "عرض الصورة" : "Photo viewer")}
        >
          <button
            type="button"
            onClick={close}
            aria-label={isArabic ? "إغلاق" : "Close"}
            className="absolute top-4 end-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label={isArabic ? "السابق" : "Previous"}
                className="absolute start-2 sm:start-6 inline-flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className={"h-6 w-6" + (isArabic ? " rotate-180" : "")} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label={isArabic ? "التالي" : "Next"}
                className="absolute end-2 sm:end-6 inline-flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className={"h-6 w-6" + (isArabic ? " rotate-180" : "")} />
              </button>
            </>
          )}

          {/* Clicking the photo itself shouldn't dismiss — only the backdrop. */}
          <img
            src={open.url}
            alt={open.caption ?? ""}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full object-contain"
          />

          {(open.caption ||
            open.date ||
            open.activity ||
            (open.people && open.people.length > 0)) && (
            <div
              className="mt-3 max-w-2xl text-center text-white/80"
              onClick={(e) => e.stopPropagation()}
            >
              {open.caption && <p className="text-sm">{open.caption}</p>}
              {open.date && (
                <p className="text-[12px] text-white/50 mt-1">
                  {formatDate(open.date, lang === "ar" ? "ar" : "en")}
                </p>
              )}
              {open.people && open.people.length > 0 && (
                <p className="mt-2 text-xs text-white/70">
                  {isArabic ? "مع: " : "With: "}
                  {open.people.map((person, index) => (
                    <span key={person.id}>
                      <Link
                        to="/about/participants"
                        search={{ participant: person.id }}
                        className="underline underline-offset-4 hover:text-white"
                      >
                        {person.name}
                      </Link>
                      {index < open.people!.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              )}
              {open.activity && (
                <Link
                  to="/activities/forums"
                  search={{ type: open.activity.forumType, open: open.activity.id }}
                  className="mt-3 inline-block text-xs uppercase tracking-widest text-white underline underline-offset-4 hover:text-white/80"
                >
                  {isArabic
                    ? `الدخول إلى ${open.activity.title} ←`
                    : `Enter ${open.activity.title} →`}
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
