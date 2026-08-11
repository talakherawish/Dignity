import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { RichText } from "@/components/RichText";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchMeetings,
  formatDate,
  hasProse,
  mediaUrl,
  type PayloadActivity,
  type PayloadMedia,
} from "@/lib/payload";

export const Route = createFileRoute("/activities/meetings")({
  head: () => ({ meta: [{ title: "Meetings — Dignity" }] }),
  component: MeetingsPage,
});

type Lang = "en" | "ar";

/**
 * Meetings are shown as a dated ledger rather than the card list the other
 * activity pages use: a meeting is an event on a day, so the day is the thing
 * to lead with, and a year rule between the groups gives a run of them shape.
 *
 * Everything except the date and the title lives inside the row and appears
 * only once it is opened. A meeting may carry a description, a write-up,
 * photographs, or none of those, and hoisting any of it into the list would
 * make the rows ragged in exactly the way the entries are uneven.
 */

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

function MeetingEntry({
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

  const prose = hasProse(lead) || hasProse(body);
  const untranslated =
    !prose &&
    (hasProse(isArabic ? item.description : item.descriptionAr) ||
      hasProse(isArabic ? item.content : item.contentAr));

  // An entry with nothing behind it is a line of text, not a control: no
  // toggle, no pointer, nothing to press that would then do nothing. An entry
  // written up in the other language still opens, to say so.
  const expandable = prose || untranslated || figures.length > 0;
  const panelId = `meeting-panel-${item.id}`;
  const titleId = `meeting-title-${item.id}`;

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
    <li className="group relative border-b border-border">
      {/* Grows from the leading edge on hover — the only ornament on the row. */}
      <span
        aria-hidden="true"
        className={
          "absolute inset-y-0 start-0 w-px origin-top bg-[color:var(--brand-magenta)] transition-transform duration-500 ease-out motion-reduce:transition-none " +
          (open ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100")
        }
      />

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
                          className={
                            "w-full object-cover transition-transform duration-700 ease-out group-hover/figure:scale-[1.03] motion-reduce:transition-none " +
                            (figures.length === 1 ? "aspect-[16/9]" : "aspect-[4/3]")
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
        <div key={n} className="flex gap-4 border-b border-border py-9 md:gap-8">
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

function MeetingsPage() {
  const { t, lang, isArabic } = useLanguage();
  const language: Lang = lang === "ar" ? "ar" : "en";
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
    staleTime: 5 * 60 * 1000,
  });

  const groups = groupByYear(items, language);

  return (
    <PageLayout>
      <PageHero
        eyebrow={`${t("activities")} — ${t("activities.meetings")}`}
        title={t("activities.meetings")}
      />
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {isLoading ? (
          <LedgerSkeleton />
        ) : items.length === 0 ? (
          <p className="border-t border-border py-16 text-center text-sm text-muted-foreground">
            {isArabic ? "لا توجد اجتماعات منشورة حالياً." : "No meetings published yet."}
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
                    <MeetingEntry
                      key={item.id}
                      item={item}
                      lang={language}
                      open={openId === item.id}
                      onToggle={() =>
                        setOpenId((current) => (current === item.id ? null : item.id))
                      }
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
