import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Download, ExternalLink, Search, X } from "lucide-react";
import { ToggleMark } from "@/components/ActivityLedger";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { Citation, CopyCitation } from "@/components/CopyCitation";
import { Highlighted } from "@/components/Highlighted";
import { chicago, entrySource, invert, sortName, uninvert } from "@/lib/citation";
import { containsAny, fold, keywordLabel, keywordsOf } from "@/lib/keywords";
import { PILL_BUTTON } from "@/lib/ui";
import {
  mediaUrl,
  openFileInNewTab,
  type BibliographyEntryType,
  type PayloadBibliographyEntry,
  type PayloadKeyword,
} from "@/lib/payload";

/**
 * The entries of one annotated bibliography, filterable by free text, type,
 * author, keyword and language -- the same filters as Muwatin's databases,
 * which this page is modelled on.
 *
 * Every filter lives in the address (?q=&type=&author=&keyword=&lang=), so a
 * filtered list can be shared or bookmarked, and pressing a keyword on any
 * entry narrows the list to it. The whole database is fetched once and
 * filtered in the browser: a few hundred citations is a small download, and it
 * keeps every keystroke instant.
 */

export type BibliographyFilters = {
  q?: string;
  type?: string;
  author?: string;
  keyword?: string;
  lang?: string;
  /** An entry to open and scroll to once the list has loaded. */
  open?: string;
};

const TYPE_LABEL: Record<BibliographyEntryType, TranslationKey> = {
  book: "databases.type.book",
  bookChapter: "databases.type.bookChapter",
  journalArticle: "databases.type.journalArticle",
  otherArticle: "databases.type.otherArticle",
  report: "databases.type.report",
  thesis: "databases.type.thesis",
  website: "databases.type.website",
  other: "databases.type.other",
};

const LANGUAGE_LABEL: Record<PayloadBibliographyEntry["language"], TranslationKey> = {
  en: "databases.lang.en",
  ar: "databases.lang.ar",
  other: "databases.lang.other",
};

/** A round mark the size of the open/close mark, for the entry's source. */
export const SOURCE_MARK =
  "group/mark relative grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:border-[color:var(--brand-magenta)] hover:text-[color:var(--brand-magenta)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-magenta)]";

/** What a round mark does, shown beside it while it's hovered or focused. */
export function MarkTip({ children }: { children: ReactNode }) {
  const { isArabic } = useLanguage();
  return (
    <span
      aria-hidden="true"
      className={
        "pointer-events-none absolute end-full top-1/2 me-2 -translate-y-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground opacity-0 transition-opacity duration-200 group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100" +
        (isArabic ? " font-arabic" : "")
      }
    >
      {children}
    </span>
  );
}

/** An entry's source, opened in a new tab: its link, or else its uploaded file. */
export function SourceLink({
  href,
  file,
  mimeType,
  className,
  label,
  children,
}: {
  href: string;
  file: string;
  mimeType?: string;
  className: string;
  /** For when the children don't name it themselves. */
  label?: string;
  children: ReactNode;
}) {
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
    >
      {children}
    </a>
  ) : (
    <button
      type="button"
      onClick={() => openFileInNewTab(file, mimeType)}
      aria-label={label}
      className={className}
    >
      {children}
    </button>
  );
}

export const smallCaps = (isArabic: boolean) =>
  "uppercase tracking-[0.2em] " + (isArabic ? "text-[15px]" : "text-[10px] md:text-[11px]");

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  const { t, isArabic } = useLanguage();
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className={"text-muted-foreground " + smallCaps(isArabic)}>{label}</span>
      {/* The browser's own arrow sits hard against the rounded edge, so it is
          hidden (appearance-none) and drawn here instead, inset like the text. */}
      <span className="relative block">
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || undefined)}
          className={
            "h-10 w-full min-w-0 appearance-none rounded-full border border-border bg-background ps-4 pe-10 text-sm text-foreground focus:border-[color:var(--brand-magenta)] focus:outline-none " +
            (value ? "border-[color:var(--brand-magenta)]/60" : "")
          }
        >
          <option value="">{t("databases.filter.any")}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
      </span>
    </label>
  );
}

/**
 * The search, folded, in each form it can be written in a citation: as typed,
 * and -- for a name -- in the other order, since a citation leads with its
 * first author surname first ("John Smith" and "Smith, John" find each other).
 */
export function searchNeedles(query: string | undefined): string[] {
  const typed = query?.trim();
  if (!typed) return [];
  const forms = [typed, invert(typed, false), invert(typed, true), uninvert(typed)];
  return [...new Set(forms.map(fold))];
}

/** A setState updater that adds the id to the set, or takes it out. */
const toggleIn = (id: string) => (current: Set<string>) => {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

function Entry({
  entry,
  open,
  onToggle,
  onKeyword,
  activeKeyword,
  needles,
  entryRef,
}: {
  entry: PayloadBibliographyEntry;
  open: boolean;
  onToggle: () => void;
  onKeyword: (id: string) => void;
  activeKeyword?: string;
  /** The folded search forms, marked wherever they appear in the citation or annotation. */
  needles: string[];
  entryRef: (el: HTMLLIElement | null) => void;
}) {
  const { t, isArabic } = useLanguage();
  const sourceDir = entry.language === "ar" ? "rtl" : "ltr";
  const keywords = keywordsOf(entry);
  // A tag is marked whole, since it may match on its name in the other language.
  const matchesSearch = (keyword: PayloadKeyword) =>
    [keyword.name, keyword.nameAr].some((name) => name && containsAny(name, needles));
  const fileUrl = entry.access === "upload" ? mediaUrl(entry.file) : "";
  const sourceUrl = entry.url || (entry.doi ? `https://doi.org/${entry.doi}` : "");
  // The annotation is the team's own words, so it comes in both languages; one
  // written in only one language is shown on both pages.
  const annotation = (
    (isArabic ? entry.annotationAr || entry.annotation : entry.annotation || entry.annotationAr) ?? ""
  ).trim();
  const sourceLink = entry.access !== "citation" ? sourceUrl : "";
  // Only an annotation opens: the source has its own mark, so there's nothing
  // else to open onto.
  const expandable = !!annotation;
  const hasSource = !!sourceLink || !!fileUrl;
  const source = { href: sourceLink, file: fileUrl, mimeType: entry.file?.mimeType };
  const panelId = `entry-panel-${entry.id}`;
  const segments = useMemo(() => chicago(entrySource(entry)), [entry]);

  const heading = (
    <div className="flex items-start gap-6">
      <div className="min-w-0 flex-1">
        <span className={"mb-2 block text-[color:var(--brand-magenta)] " + smallCaps(isArabic)}>
          {t(TYPE_LABEL[entry.entryType] ?? "databases.type.other")}
          {/* The language is worth naming only when it isn't the page's own. */}
          {entry.language !== (isArabic ? "ar" : "en") && (
            <span className="text-muted-foreground"> · {t(LANGUAGE_LABEL[entry.language])}</span>
          )}
        </span>
        {/* Chicago's hanging indent: every line after the first steps in. */}
        <p
          dir={sourceDir}
          lang={entry.language === "ar" ? "ar" : "en"}
          className="-indent-8 ps-8 text-start font-serif text-[1.05rem] leading-relaxed text-primary md:text-lg"
        >
          <Citation segments={segments} needles={needles} />
        </p>
        {expandable && (
          <span
            className={
              "mt-3 inline-block transition-colors duration-300 " +
              smallCaps(isArabic) +
              (open
                ? " text-[color:var(--brand-magenta)]"
                : " text-muted-foreground group-hover:text-[color:var(--brand-magenta)]")
            }
          >
            {open ? (isArabic ? "إغلاق" : "Close") : t("databases.annotation")}
          </span>
        )}
      </div>
      {/* Kept even without the open/close mark, as room for the source mark. */}
      {(expandable || hasSource) && (
        <div className="hidden w-8 shrink-0 pt-6 md:block">
          {expandable && (
            <span className="group/mark relative block">
              <ToggleMark open={open} />
              <MarkTip>{t("databases.annotation")}</MarkTip>
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <li
      ref={entryRef}
      className="group relative scroll-mt-28 border-t border-border first:border-t-0"
    >
      {expandable ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full cursor-pointer py-7 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-magenta)] focus-visible:ring-offset-2"
        >
          {heading}
        </button>
      ) : (
        <div className="py-7">{heading}</div>
      )}

      {/* The source in one press, just under the open/close mark (or in its
          place) -- outside the button, since a link can't sit inside one. */}
      {hasSource && (
        <div
          className={
            "absolute end-0 hidden md:block " + (expandable ? "top-[5.75rem]" : "top-[3.25rem]")
          }
        >
          <SourceLink {...source} className={SOURCE_MARK} label={t("databases.source")}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <MarkTip>{t("databases.source")}</MarkTip>
          </SourceLink>
        </div>
      )}

      {expandable && (
        <div
          id={panelId}
          role="region"
          inert={!open}
          className={
            "grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none " +
            (open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
          }
        >
          <div className="overflow-hidden">
            <div className="pb-8">
              {annotation && (
                <p
                  dir="auto"
                  className="max-w-3xl whitespace-pre-line text-start text-sm leading-relaxed text-foreground"
                >
                  <Highlighted text={annotation} needles={needles} />
                </p>
              )}
              {/* The source has its own mark; only the download is left to offer. */}
              {fileUrl && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <a href={fileUrl} download className={PILL_BUTTON}>
                    <Download className="h-3.5 w-3.5" />
                    {t("publications.download")}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Outside the button, so each of these can be pressed on its own: a
          tag narrows the list to that keyword rather than opening the entry. */}
      <div className="-mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 pb-7">
        {/* Phones have no open/close mark to sit the source under, and no
            hover to name it, so here it's named outright. */}
        {hasSource && (
          <SourceLink
            {...source}
            className={
              "inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-[color:var(--brand-magenta)] md:hidden" +
              (isArabic ? " font-arabic" : "")
            }
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {t("databases.source")}
          </SourceLink>
        )}
        <CopyCitation segments={segments} arabic={entry.language === "ar"} />
        {annotation && (
          <CopyCitation
            segments={segments}
            arabic={entry.language === "ar"}
            annotation={annotation}
          />
        )}
        {keywords.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("databases.keywords")}>
            {keywords.map((keyword) => (
              <li key={keyword.id}>
                <button
                  type="button"
                  onClick={() => onKeyword(keyword.id)}
                  className={
                    "rounded-full border px-2.5 py-0.5 text-xs transition-colors " +
                    (activeKeyword === keyword.id
                      ? "border-[color:var(--brand-magenta)] bg-[color:var(--brand-magenta)] text-white"
                      : matchesSearch(keyword)
                        ? "search-mark border-[color:var(--brand-cyan)]"
                        : "border-border text-muted-foreground hover:border-[color:var(--brand-magenta)]/50 hover:text-[color:var(--brand-magenta)]")
                  }
                >
                  {keywordLabel(keyword, isArabic)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function BibliographyBrowser({
  entries,
  isLoading,
  filters,
  onFiltersChange,
}: {
  entries: PayloadBibliographyEntry[];
  isLoading: boolean;
  filters: BibliographyFilters;
  onFiltersChange: (next: BibliographyFilters) => void;
}) {
  const { t, lang, isArabic } = useLanguage();
  const locale = lang === "ar" ? "ar" : "en";
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const entryElements = useRef(new Map<string, HTMLLIElement>());
  const appliedInitialOpen = useRef(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // The search box updates the address as it's typed into, but keeps its own
  // state so the cursor doesn't jump while the URL catches up.
  const [query, setQuery] = useState(filters.q ?? "");
  useEffect(() => setQuery(filters.q ?? ""), [filters.q]);

  const set = (patch: Partial<BibliographyFilters>) =>
    onFiltersChange({ ...filters, ...patch, open: undefined });

  const sorted = useMemo(
    () =>
      entries
        .map((entry) => ({ entry, key: sortName(entrySource(entry)) }))
        .sort((a, b) => a.key.localeCompare(b.key, locale))
        .map(({ entry }) => entry),
    [entries, locale],
  );

  // Only what the database actually contains is offered as a filter.
  const options = useMemo(() => {
    const types = new Set<BibliographyEntryType>();
    const authors = new Set<string>();
    const keywords = new Map<string, PayloadKeyword>();
    for (const entry of entries) {
      types.add(entry.entryType);
      for (const author of entry.authors ?? []) authors.add(author.name.trim());
      for (const keyword of keywordsOf(entry)) keywords.set(keyword.id, keyword);
    }
    const byLabel = (a: { label: string }, b: { label: string }) =>
      a.label.localeCompare(b.label, locale);
    return {
      types: [...types]
        .map((value) => ({ value, label: t(TYPE_LABEL[value] ?? "databases.type.other") }))
        .sort(byLabel),
      // Always English and Arabic, whatever the database holds; "Any" covers
      // every other language an entry might be in.
      languages: (["en", "ar"] as const).map((value) => ({
        value,
        label: t(LANGUAGE_LABEL[value]),
      })),
      authors: [...authors].map((name) => ({ value: name, label: name })).sort(byLabel),
      keywords: [...keywords.values()]
        .map((keyword) => ({ value: keyword.id, label: keywordLabel(keyword, isArabic) }))
        .sort(byLabel),
    };
  }, [entries, isArabic, locale, t]);

  const needles = useMemo(() => searchNeedles(filters.q), [filters.q]);

  const visible = useMemo(() => {
    return sorted.filter((entry) => {
      if (filters.type && entry.entryType !== filters.type) return false;
      if (filters.lang && entry.language !== filters.lang) return false;
      if (filters.author && !(entry.authors ?? []).some((a) => a.name.trim() === filters.author))
        return false;
      if (filters.keyword && !keywordsOf(entry).some((k) => k.id === filters.keyword)) return false;
      if (needles.length === 0) return true;
      const haystack = [
        entry.title,
        entry.containerTitle,
        entry.annotation,
        entry.annotationAr,
        entry.publisher,
        ...(entry.authors ?? []).map((a) => a.name),
        ...(entry.editors ?? []).map((e) => e.name),
        ...keywordsOf(entry).flatMap((k) => [k.name, k.nameAr]),
      ]
        .filter(Boolean)
        .join(" ");
      return containsAny(haystack, needles);
    });
  }, [sorted, filters, needles]);

  // An entry whose annotation holds the search opens by itself so the match
  // can be seen; the reader can still close it until the search changes.
  const annotationHits = useMemo(
    () =>
      new Set(
        visible
          .filter((entry) => entry.annotation && containsAny(entry.annotation, needles))
          .map((entry) => entry.id),
      ),
    [visible, needles],
  );
  const [closedHits, setClosedHits] = useState<Set<string>>(new Set());
  useEffect(() => setClosedHits(new Set()), [needles]);
  const isOpen = (id: string) => (annotationHits.has(id) ? !closedHits.has(id) : openIds.has(id));

  useEffect(() => {
    const target = filters.open;
    if (!target || appliedInitialOpen.current || !entries.some((e) => e.id === target)) return;
    appliedInitialOpen.current = true;
    setOpenIds((current) => new Set(current).add(target));
    requestAnimationFrame(() =>
      entryElements.current.get(target)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [filters.open, entries]);

  const filtering = !!(
    filters.q ||
    filters.type ||
    filters.author ||
    filters.keyword ||
    filters.lang
  );
  const number = (n: number) => n.toLocaleString(isArabic ? "ar-EG-u-nu-latn" : "en-US");

  return (
    <section
      className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div ref={filtersRef} className="scroll-mt-28 border-b border-border py-5">
        <label className="relative block">
          <span className="sr-only">{t("databases.search")}</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            placeholder={t("databases.search")}
            onChange={(event) => {
              setQuery(event.target.value);
              set({ q: event.target.value || undefined });
            }}
            className="h-11 w-full rounded-full border border-border bg-background ps-11 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-[color:var(--brand-magenta)] focus:outline-none"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <FilterSelect
            label={t("databases.filter.type")}
            value={filters.type}
            options={options.types}
            onChange={(type) => set({ type })}
          />
          <FilterSelect
            label={t("databases.filter.author")}
            value={filters.author}
            options={options.authors}
            onChange={(author) => set({ author })}
          />
          <FilterSelect
            label={t("databases.filter.keyword")}
            value={filters.keyword}
            options={options.keywords}
            onChange={(keyword) => set({ keyword })}
          />
          <FilterSelect
            label={t("databases.filter.language")}
            value={filters.lang}
            options={options.languages}
            onChange={(language) => set({ lang: language })}
          />
        </div>
        {!isLoading && entries.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {t("databases.showing")} {number(visible.length)} {t("databases.of")}{" "}
              {number(entries.length)}
            </span>
            {filtering && (
              <button
                type="button"
                onClick={() => onFiltersChange({})}
                className="inline-flex items-center gap-1 text-[color:var(--brand-magenta)] hover:underline"
              >
                <X className="h-3.5 w-3.5" />
                {t("databases.filter.clear")}
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6 pt-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="space-y-3">
              <div className="h-3 w-20 animate-pulse rounded-sm bg-secondary/40" />
              <div className="h-5 w-full animate-pulse rounded-sm bg-secondary/50" />
              <div className="h-5 w-2/3 animate-pulse rounded-sm bg-secondary/50" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {t("databases.entriesEmpty")}
        </p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {t("databases.noMatches")}
        </p>
      ) : (
        <ul>
          {visible.map((entry) => (
            <Entry
              key={entry.id}
              entry={entry}
              open={isOpen(entry.id)}
              activeKeyword={filters.keyword}
              needles={needles}
              onKeyword={(keyword) => {
                set({ keyword: filters.keyword === keyword ? undefined : keyword });
                filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              entryRef={(el) => {
                if (el) entryElements.current.set(entry.id, el);
                else entryElements.current.delete(entry.id);
              }}
              onToggle={() =>
                annotationHits.has(entry.id)
                  ? setClosedHits(toggleIn(entry.id))
                  : setOpenIds(toggleIn(entry.id))
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
