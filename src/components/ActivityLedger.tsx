import { useState } from "react";
import { RichText } from "@/components/RichText";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatDate,
  hasProse,
  mediaUrl,
  type PayloadActivity,
  type PayloadMedia,
} from "@/lib/payload";

/**
 * A dated ledger of activities: meetings, seminars, and anything else in
 * Activities that is an event on a day.
 *
 * These pages used to be a stack of bordered cards with the date set smaller
 * than the body text and the title at 14px, and the write-up, the photographs
 * and everything else the entry carried were fetched and then never rendered.
 * Here the day leads, each year opens with its own numeral and rule, and
 * pressing a row opens it in place.
 *
 * Everything except the date and the title lives inside the row. An entry may
 * carry a description, a write-up, photographs, or none of those, and hoisting
 * any of it into the list would leave the rows as ragged as the entries are
 * uneven.
 */

type Lang = "en" | "ar";

/**
 * The date, split into parts.
 *
 * `formatDate` returns one finished string, which suits a card but not this
 * page — the day is set several times the size of the month beside it, so the
 * two have to arrive separately. Arabic keeps its own numerals, matching the
 * ar-EG locale `formatDate` uses elsewhere.
 */
function dateParts(iso: string, lang: Lang) {
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return null;
  return {
    day: date.toLocaleDateString(locale, { day: "numeric" }),
    month: date.toLocaleDateString(locale, { month: "long" }),
    year: date.toLocaleDateString(locale, { year: "numeric" }),
    yearKey: date.getFullYear(),
  };
}

type YearGroup = { key: number; label: string; items: PayloadActivity[] };

/**
 * Consecutive runs of the same year, in the order the API returned them
 * (newest first). Sequential rather than keyed by year so the existing sort is
 * carried through untouched.
 */
function groupByYear(items: PayloadActivity[], lang: Lang): YearGroup[] {
  const groups: YearGroup[] = [];
  for (const item of items) {
    const parts = dateParts(item.date, lang);
    const key = parts?.yearKey ?? 0;
    const previous = groups[groups.length - 1];
    if (previous && previous.key === key) previous.items.push(item);
    else groups.push({ key, label: parts?.year ?? "", items: [item] });
  }
  return groups;
}

type Figure = { url: string; alt: string; caption?: string };

/** The featured image first, then the gallery, skipping anything unresolved. */
function figuresOf(item: PayloadActivity, lang: Lang): Figure[] {
  const figures: Figure[] = [];
  const add = (media: PayloadMedia | undefined, caption?: string) => {
    const url = mediaUrl(media);
    if (!url) return;
    figures.push({ url, alt: media?.alt ?? "", caption: caption?.trim() || undefined });
  };

  add(item.image);
  for (const entry of item.gallery ?? []) {
    add(entry.image, lang === "ar" ? (entry.captionAr ?? entry.caption) : entry.caption);
  }
  return figures;
}

/** Plus that turns into a cross. */
function ToggleMark({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors duration-300 group-hover:border-[color:var(--brand-magenta)] group-hover:text-[color:var(--brand-magenta)]"
    >
      <span className="absolute h-px w-3 bg-current" />
      <span
        className={
          "absolute h-px w-3 bg-current transition-transform duration-300 motion-reduce:transition-none " +
          (open ? "rotate-0" : "rotate-90")
        }
      />
    </span>
  );
}

function ActivityEntry({
  item,
  lang,
  open,
  onToggle,
}: {
  item: PayloadActivity;
  lang: Lang;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  const isArabic = lang === "ar";
  const title = isArabic ? (item.titleAr ?? item.title) : item.title;

  // Prose is read from the visitor's own language only. A title still falls
  // back, because every entry has one and a row cannot be blank -- but handing
  // an Arabic reader a paragraph of English, unannounced, is worse than
  // telling them the translation is coming.
  const lead = isArabic ? item.descriptionAr : item.description;
  const body = isArabic ? item.contentAr : item.content;
  const figures = figuresOf(item, lang);
  const parts = dateParts(item.date, lang);

  // Only some meetings are a round table or a discussion; the rest are simply
  // meetings and say nothing here.
  const kind =
    item.kind === "roundtable"
      ? t("activity.kind.roundtable")
      : item.kind === "discussion"
        ? t("activity.kind.discussion")
        : null;

  const prose = hasProse(lead) || hasProse(body);
  const untranslated =
    !prose &&
    (hasProse(isArabic ? item.description : item.descriptionAr) ||
      hasProse(isArabic ? item.content : item.contentAr));

  // An entry with nothing behind it is a line of text, not a control: no
  // toggle, no pointer, nothing to press that would then do nothing. An entry
  // written up in the other language still opens, to say so.
  const expandable = prose || untranslated || figures.length > 0;
  const panelId = `activity-panel-${item.id}`;
  const titleId = `activity-title-${item.id}`;

  const heading = (
    <div className="grid grid-cols-[3.5rem_1fr] gap-x-4 md:grid-cols-[7rem_1fr_auto] md:gap-x-8">
      <div className="pt-1">
        {parts ? (
          <>
            <span className="block font-serif text-3xl leading-none text-primary tabular-nums md:text-[2.6rem]">
              {parts.day}
            </span>
            <span className="mt-2 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:text-[11px]">
              {parts.month}
            </span>
          </>
        ) : (
          <span className="block text-xs text-muted-foreground">{formatDate(item.date, lang)}</span>
        )}
      </div>

      <div className="min-w-0">
        {kind && (
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-[color:var(--brand-magenta)]">
            {kind}
          </span>
        )}
        <h3
          id={titleId}
          className={
            "font-serif text-lg leading-snug text-primary transition-colors duration-300 md:text-[1.6rem] " +
            (expandable ? "group-hover:text-[color:var(--brand-magenta)]" : "")
          }
        >
          {title}
        </h3>
        {expandable && (
          <span
            className={
              "mt-3 inline-block text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 md:text-[11px] " +
              (open
                ? "text-[color:var(--brand-magenta)]"
                : "text-muted-foreground group-hover:text-[color:var(--brand-magenta)]")
            }
          >
            {open ? (isArabic ? "إغلاق" : "Close") : isArabic ? "التفاصيل" : "Details"}
          </span>
        )}
      </div>

      {expandable && (
        <div className="hidden pt-1 md:block">
          <ToggleMark open={open} />
        </div>
      )}
    </div>
  );

  return (
    /* No rule under each entry: the year rules alone divide the page, and a
       line under every row turned a short list into a stack of boxes. The
       vertical rhythm does the separating instead. */
    <li className="group relative">
      {expandable ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full cursor-pointer py-7 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-magenta)] focus-visible:ring-offset-2 md:py-9"
        >
          {heading}
        </button>
      ) : (
        <div className="py-7 md:py-9">{heading}</div>
      )}

      {expandable && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={titleId}
          inert={!open}
          className={
            "grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none " +
            (open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
          }
        >
          <div className="overflow-hidden">
            <div className="pb-10 md:ps-[9rem] md:pb-12">
              {hasProse(lead) && (
                <RichText
                  value={lead}
                  className="font-serif text-[15px] leading-relaxed text-foreground/80 md:text-lg"
                />
              )}
              {hasProse(body) && (
                <RichText
                  value={body}
                  className="mt-5 space-y-4 text-sm leading-7 text-foreground/70 md:text-[15px]"
                />
              )}
              {untranslated && <TranslationNotice />}
              {figures.length > 0 && (
                <div
                  className={
                    "mt-7 grid gap-3 " +
                    (figures.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3")
                  }
                >
                  {figures.map((figure, index) => (
                    <figure key={`${figure.url}-${index}`} className="group/figure">
                      <div className="overflow-hidden rounded-sm border border-border bg-secondary/40">
                        <img
                          src={figure.url}
                          alt={figure.alt}
                          loading="lazy"
                          // A lone image runs the full width of the column, so
                          // it is also capped in viewport units: a picture
                          // taller than the window cannot be seen at all.
                          className={
                            "w-full object-cover transition-transform duration-700 ease-out group-hover/figure:scale-[1.03] motion-reduce:transition-none " +
                            (figures.length === 1 ? "aspect-[16/9] max-h-[70vh]" : "aspect-[4/3]")
                          }
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
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function LedgerSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex gap-4 py-9 md:gap-8">
          <div className="h-10 w-12 shrink-0 animate-pulse rounded-sm bg-secondary/50 md:w-20" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-3/4 animate-pulse rounded-sm bg-secondary/50" />
            <div className="h-3 w-16 animate-pulse rounded-sm bg-secondary/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityLedger({
  items,
  isLoading,
  empty,
}: {
  items: PayloadActivity[];
  isLoading: boolean;
  /** Shown when the collection has nothing published, in the reader's language. */
  empty: string;
}) {
  const { lang, isArabic } = useLanguage();
  const language: Lang = lang === "ar" ? "ar" : "en";
  const [openId, setOpenId] = useState<string | null>(null);

  const groups = groupByYear(items, language);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      {isLoading ? (
        <LedgerSkeleton />
      ) : items.length === 0 ? (
        <p className="border-t border-border py-16 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div dir={isArabic ? "rtl" : "ltr"}>
          {groups.map((group) => (
            <section key={group.key} className="pt-10 first:pt-0">
              <div className="flex items-baseline gap-4 pb-1 md:gap-6">
                <h2 className="font-serif text-4xl leading-none text-primary/20 tabular-nums md:text-5xl">
                  {group.label}
                </h2>
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
              <ul>
                {group.items.map((item) => (
                  <ActivityEntry
                    key={item.id}
                    item={item}
                    lang={language}
                    open={openId === item.id}
                    onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
