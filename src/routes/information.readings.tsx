import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fold, keywordLabel, keywordsOf } from "@/lib/keywords";
import { extractText, fetchReadings, mediaUrl, type PayloadReading } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

type ReadingsSearch = { q?: string; keyword?: string };

const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);

export const Route = createFileRoute("/information/readings")({
  validateSearch: (search: Record<string, unknown>): ReadingsSearch => ({
    q: text(search.q),
    keyword: text(search.keyword),
  }),
  component: ReadingsPage,
});

/**
 * Texts the team has read and written about, one card each, leading to the
 * reading's own page (information.readings_.$slug.tsx). The cover is the
 * text's first page -- Payload renders one for every uploaded PDF -- or, for
 * a reading with no hosted file, its title set as a plain cover.
 *
 * Narrowed by a search box and by keyword, both kept in the address so a
 * keyword pressed on a reading's own page lands here already filtered.
 */
function ReadingsPage() {
  const { t, lang, isArabic } = useLanguage();
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: readings = [], isLoading } = useQuery({
    queryKey: ["readings"],
    queryFn: fetchReadings,
  });

  const [query, setQuery] = useState(filters.q ?? "");
  useEffect(() => setQuery(filters.q ?? ""), [filters.q]);
  const setFilters = (next: ReadingsSearch) =>
    navigate({ search: { ...filters, ...next }, replace: true });

  const keywords = useMemo(() => {
    const all = new Map(readings.flatMap((r) => keywordsOf(r)).map((k) => [k.id, k]));
    return [...all.values()].sort((a, b) =>
      keywordLabel(a, isArabic).localeCompare(keywordLabel(b, isArabic), lang),
    );
  }, [readings, isArabic, lang]);

  const visible = useMemo(() => {
    const needle = fold(filters.q?.trim() ?? "");
    return readings.filter((reading) => {
      if (filters.keyword && !keywordsOf(reading).some((k) => k.id === filters.keyword))
        return false;
      if (!needle) return true;
      return fold(
        [
          reading.title,
          reading.titleAr,
          ...(reading.authors ?? []).map((a) => a.name),
          ...extractText(reading.description),
          ...extractText(reading.descriptionAr),
          ...keywordsOf(reading).flatMap((k) => [k.name, k.nameAr]),
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(needle);
    });
  }, [readings, filters]);

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("information")}
        eyebrowColor={SECTION_COLORS.information}
        title={t("information.readings")}
      />

      <section
        className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8"
        dir={isArabic ? "rtl" : "ltr"}
      >
        {readings.length > 0 && (
          <div className="mb-10 space-y-4">
            <label className="relative block max-w-xl">
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
                  setFilters({ q: event.target.value || undefined });
                }}
                className="h-11 w-full rounded-full border border-border bg-background pe-4 ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-[color:var(--brand-magenta)] focus:outline-none"
              />
            </label>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((keyword) => {
                  const active = filters.keyword === keyword.id;
                  return (
                    <button
                      key={keyword.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilters({ keyword: active ? undefined : keyword.id })}
                      className={
                        "rounded-full border px-3 py-1 text-xs transition-colors " +
                        (active
                          ? "border-[color:var(--brand-magenta)] bg-[color:var(--brand-magenta)] text-white"
                          : "border-border text-muted-foreground hover:border-[color:var(--brand-magenta)]/50 hover:text-[color:var(--brand-magenta)]")
                      }
                    >
                      {keywordLabel(keyword, isArabic)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[3/4] animate-pulse rounded-sm bg-secondary/40" />
            ))}
          </div>
        ) : readings.length === 0 ? (
          <p className="border-t border-border py-16 text-center text-sm text-muted-foreground">
            {t("readings.empty")}
          </p>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t("readings.noMatches")}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((reading) => (
              <ReadingCard key={reading.id} reading={reading} />
            ))}
          </ul>
        )}
      </section>
    </PageLayout>
  );
}

function ReadingCard({ reading }: { reading: PayloadReading }) {
  const { isArabic } = useLanguage();
  const title = isArabic ? (reading.titleAr ?? reading.title) : reading.title;
  const file = isArabic ? (reading.fileAr ?? reading.file) : reading.file;
  const cover = mediaUrl(file?.thumbnail);
  const byline = [(reading.authors ?? []).map((a) => a.name).join(", "), reading.year]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <Link
        to="/information/readings/$slug"
        params={{ slug: reading.slug ?? reading.id }}
        className="group block"
      >
        <div className="aspect-[3/4] overflow-hidden rounded-sm border border-border bg-secondary/40 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            // No hosted file, so no first page to show: the title stands in,
            // set like a plain cloth cover.
            <div className="flex h-full flex-col border-t-4 border-[color:var(--brand-magenta)] bg-primary p-5 text-primary-foreground">
              <span className="font-serif text-lg leading-snug">{title}</span>
            </div>
          )}
        </div>
        {byline && (
          <span
            className={
              "mt-4 block uppercase tracking-[0.16em] text-muted-foreground " +
              (isArabic ? "text-[14px]" : "text-[10px]")
            }
          >
            {byline}
          </span>
        )}
        <h2 className="mt-1.5 font-serif text-base leading-snug text-primary transition-colors duration-300 group-hover:text-[color:var(--brand-magenta)] md:text-lg">
          {title}
        </h2>
      </Link>
    </li>
  );
}
