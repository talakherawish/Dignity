import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Search, X } from "lucide-react";
import {
  FilterSelect,
  MarkTip,
  SOURCE_MARK,
  SourceLink,
  searchNeedles,
  smallCaps,
} from "@/components/BibliographyBrowser";
import { Highlighted } from "@/components/Highlighted";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { containsAny, keywordLabel, keywordsOf } from "@/lib/keywords";
import {
  mediaUrl,
  type PayloadKeyword,
  type PayloadMedia,
  type PayloadReading,
  type ReadingType,
} from "@/lib/payload";

/**
 * The readings and documents of one subject, filterable by free text, type,
 * author, keyword and language -- the same filters, in the same place, as a
 * database's entries (BibliographyBrowser), so the two Information pages work
 * alike.
 *
 * A reading is simpler than a bibliography entry: no annotation to open and no
 * citation style, since it is there to be opened rather than cited. Each row
 * is its type, its title linked to the source, who wrote or issued it, the
 * year and where it is from, an optional one-line note, and its keywords.
 *
 * A reading may hold the same source in the other language (an English
 * declaration and its Arabic translation). Readers see the version in their
 * own language first, with the other one offered beside it.
 *
 * Every filter lives in the address (?q=&type=&author=&keyword=&lang=), and
 * the whole subject is fetched once and filtered in the browser.
 */

export type ReadingFilters = {
  q?: string;
  type?: string;
  author?: string;
  keyword?: string;
  lang?: string;
};

const TYPE_LABEL: Record<ReadingType, TranslationKey> = {
  book: "readings.type.book",
  bookChapter: "readings.type.bookChapter",
  article: "readings.type.article",
  report: "readings.type.report",
  document: "readings.type.document",
  thesis: "readings.type.thesis",
  video: "readings.type.video",
  website: "readings.type.website",
  other: "readings.type.other",
};

const LANGUAGE_LABEL: Record<PayloadReading["language"], TranslationKey> = {
  en: "databases.lang.en",
  ar: "databases.lang.ar",
  other: "databases.lang.other",
};

type Version = {
  title: string;
  link?: string;
  file?: PayloadMedia;
  language: PayloadReading["language"];
};

const hasOther = (reading: PayloadReading) =>
  !!(reading.otherVersion?.title || reading.otherVersion?.link || reading.otherVersion?.file);

/**
 * The version a reader of `pageLanguage` sees first, and the other one, if
 * the reading has both. The other version is in Arabic for a non-Arabic
 * source, and in English for an Arabic one.
 */
function versions(
  reading: PayloadReading,
  pageLanguage: "en" | "ar",
): { shown: Version; alternate?: Version } {
  const main: Version = {
    title: reading.title,
    link: reading.link,
    file: reading.file,
    language: reading.language,
  };
  if (!hasOther(reading)) return { shown: main };
  const other: Version = {
    title: reading.otherVersion?.title || reading.title,
    link: reading.otherVersion?.link,
    file: reading.otherVersion?.file,
    language: reading.language === "ar" ? "en" : "ar",
  };
  return reading.language !== pageLanguage && other.language === pageLanguage
    ? { shown: other, alternate: main }
    : { shown: main, alternate: other };
}

/** Where a version opens: its link, or its file -- or nothing. */
const target = (version: Version | undefined) => ({
  href: version?.link ?? "",
  file: mediaUrl(version?.file),
  mimeType: version?.file?.mimeType,
});
const opens = (version: Version | undefined) => !!(version?.link || mediaUrl(version?.file));

function ReadingRow({
  reading,
  onKeyword,
  activeKeyword,
  needles,
}: {
  reading: PayloadReading;
  onKeyword: (id: string) => void;
  activeKeyword?: string;
  needles: string[];
}) {
  const { t, isArabic } = useLanguage();
  const { shown, alternate } = versions(reading, isArabic ? "ar" : "en");
  // A version with only a title (no link or file of its own) opens the other.
  const source = opens(shown) ? target(shown) : target(alternate);
  const hasSource = !!(source.href || source.file);
  const alternateOpens = opens(alternate) && opens(shown);
  const fileUrl = mediaUrl(shown.file) || (!opens(shown) ? mediaUrl(alternate?.file) : "");
  const dir = shown.language === "ar" ? "rtl" : "ltr";
  const keywords = keywordsOf(reading);
  const matchesSearch = (keyword: PayloadKeyword) =>
    [keyword.name, keyword.nameAr].some((name) => name && containsAny(name, needles));
  const byline = [
    (reading.authors ?? []).map((a) => a.name).join(", "),
    reading.year,
    reading.source,
  ].filter(Boolean);

  const title = <Highlighted text={shown.title} needles={needles} />;

  return (
    <li className="group relative border-t border-border py-7 first:border-t-0">
      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <span className={"mb-2 block text-[color:var(--brand-magenta)] " + smallCaps(isArabic)}>
            {t(TYPE_LABEL[reading.itemType] ?? "readings.type.other")}
            {/* The language is worth naming only when it isn't the page's own. */}
            {shown.language !== (isArabic ? "ar" : "en") && (
              <span className="text-muted-foreground"> · {t(LANGUAGE_LABEL[shown.language])}</span>
            )}
          </span>
          <h2
            dir={dir}
            lang={shown.language === "ar" ? "ar" : "en"}
            className="text-start font-serif text-[1.05rem] leading-relaxed text-primary md:text-lg"
          >
            {hasSource ? (
              <SourceLink
                {...source}
                className="text-start transition-colors duration-300 hover:text-[color:var(--brand-magenta)]"
              >
                {title}
              </SourceLink>
            ) : (
              title
            )}
          </h2>
          {byline.length > 0 && (
            <p dir={dir} className="mt-1.5 text-start text-sm text-muted-foreground">
              <Highlighted text={byline.join(" · ")} needles={needles} />
            </p>
          )}
          {reading.note?.trim() && (
            <p className="mt-3 max-w-3xl whitespace-pre-line text-start text-sm leading-relaxed text-foreground">
              <Highlighted text={reading.note.trim()} needles={needles} />
            </p>
          )}
        </div>
        {hasSource && (
          <div className="hidden w-8 shrink-0 pt-6 md:block">
            <SourceLink {...source} className={SOURCE_MARK} label={t("databases.source")}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <MarkTip>{t("databases.source")}</MarkTip>
            </SourceLink>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        {/* Phones have no hover to name the round mark, so it's named here. */}
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
        {fileUrl && (
          <a
            href={fileUrl}
            download
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-[color:var(--brand-magenta)]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t("publications.download")}
          </a>
        )}
        {alternate && alternateOpens && (
          <SourceLink
            {...target(alternate)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-[color:var(--brand-magenta)]"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {t(alternate.language === "ar" ? "readings.alsoIn.ar" : "readings.alsoIn.en")}
          </SourceLink>
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

export function ReadingsBrowser({
  readings,
  isLoading,
  filters,
  onFiltersChange,
}: {
  readings: PayloadReading[];
  isLoading: boolean;
  filters: ReadingFilters;
  onFiltersChange: (next: ReadingFilters) => void;
}) {
  const { t, lang, isArabic } = useLanguage();
  const locale = lang === "ar" ? "ar" : "en";
  const pageLanguage = isArabic ? "ar" : "en";

  // The search box updates the address as it's typed into, but keeps its own
  // state so the cursor doesn't jump while the URL catches up.
  const [query, setQuery] = useState(filters.q ?? "");
  useEffect(() => setQuery(filters.q ?? ""), [filters.q]);
  const set = (patch: Partial<ReadingFilters>) => onFiltersChange({ ...filters, ...patch });

  const sorted = useMemo(
    () =>
      readings
        .map((reading) => ({ reading, key: versions(reading, pageLanguage).shown.title }))
        .sort((a, b) => a.key.localeCompare(b.key, locale))
        .map(({ reading }) => reading),
    [readings, pageLanguage, locale],
  );

  // Only what the subject actually contains is offered as a filter.
  const options = useMemo(() => {
    const types = new Set<ReadingType>();
    const authors = new Set<string>();
    const keywords = new Map<string, PayloadKeyword>();
    for (const reading of readings) {
      types.add(reading.itemType);
      for (const author of reading.authors ?? []) authors.add(author.name.trim());
      for (const keyword of keywordsOf(reading)) keywords.set(keyword.id, keyword);
    }
    const byLabel = (a: { label: string }, b: { label: string }) =>
      a.label.localeCompare(b.label, locale);
    return {
      types: [...types]
        .map((value) => ({ value, label: t(TYPE_LABEL[value] ?? "readings.type.other") }))
        .sort(byLabel),
      languages: (["en", "ar"] as const).map((value) => ({
        value,
        label: t(LANGUAGE_LABEL[value]),
      })),
      authors: [...authors].map((name) => ({ value: name, label: name })).sort(byLabel),
      keywords: [...keywords.values()]
        .map((keyword) => ({ value: keyword.id, label: keywordLabel(keyword, isArabic) }))
        .sort(byLabel),
    };
  }, [readings, isArabic, locale, t]);

  const needles = useMemo(() => searchNeedles(filters.q), [filters.q]);

  const visible = useMemo(() => {
    return sorted.filter((reading) => {
      if (filters.type && reading.itemType !== filters.type) return false;
      // A reading is in a language if either of its versions is.
      if (filters.lang) {
        const languages = [reading.language];
        if (hasOther(reading)) languages.push(reading.language === "ar" ? "en" : "ar");
        if (!languages.includes(filters.lang as PayloadReading["language"])) return false;
      }
      if (filters.author && !(reading.authors ?? []).some((a) => a.name.trim() === filters.author))
        return false;
      if (filters.keyword && !keywordsOf(reading).some((k) => k.id === filters.keyword))
        return false;
      if (needles.length === 0) return true;
      const haystack = [
        reading.title,
        reading.otherVersion?.title,
        reading.source,
        reading.note,
        reading.year,
        ...(reading.authors ?? []).map((a) => a.name),
        ...keywordsOf(reading).flatMap((k) => [k.name, k.nameAr]),
      ]
        .filter(Boolean)
        .join(" ");
      return containsAny(haystack, needles);
    });
  }, [sorted, filters, needles]);

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
      <div className="border-b border-border py-5">
        <label className="relative block">
          <span className="sr-only">{t("readings.search")}</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            placeholder={t("readings.search")}
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
        {!isLoading && readings.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {t("databases.showing")} {number(visible.length)} {t("databases.of")}{" "}
              {number(readings.length)}
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
              <div className="h-4 w-1/2 animate-pulse rounded-sm bg-secondary/40" />
            </div>
          ))}
        </div>
      ) : readings.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {t("readings.itemsEmpty")}
        </p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{t("readings.noMatches")}</p>
      ) : (
        <ul>
          {visible.map((reading) => (
            <ReadingRow
              key={reading.id}
              reading={reading}
              activeKeyword={filters.keyword}
              needles={needles}
              onKeyword={(keyword) =>
                set({ keyword: filters.keyword === keyword ? undefined : keyword })
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
