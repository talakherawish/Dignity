import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildSearchIndex } from "@/lib/search";

type SearchParams = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: SearchPage,
});

function ResultSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="h-24 animate-pulse rounded-md border border-border bg-secondary/30"
        />
      ))}
    </div>
  );
}

function SearchPage() {
  const { q } = Route.useSearch();
  const { t, lang, isArabic } = useLanguage();
  const query = q?.trim() ?? "";

  // Fetched once per visit and cached while typing — a new query re-filters
  // the same list rather than re-fetching it. No staleTime, though: a fresh
  // visit should reflect anything an editor just published or unpublished,
  // not a copy of the index from up to five minutes ago.
  const { data: index = [], isLoading } = useQuery({
    queryKey: ["search-index"],
    queryFn: buildSearchIndex,
  });

  const results = query
    ? index.filter((item) => item.searchText.includes(query.toLowerCase()))
    : [];

  return (
    <PageLayout>
      <PageHero
        title={isArabic ? `نتائج البحث عن "${query}"` : `Search results for "${query}"`}
        description={
          isLoading
            ? undefined
            : results.length > 0
              ? isArabic
                ? `${results.length} نتيجة`
                : `${results.length} result${results.length === 1 ? "" : "s"}`
              : isArabic
                ? "لا توجد نتائج"
                : "No results found"
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <ResultSkeleton />
        ) : results.length > 0 ? (
          <div className="grid gap-4">
            {results.map((result, i) => (
              <Link
                key={i}
                to={result.to}
                className={`group block p-5 border border-border rounded-md bg-card hover:border-accent/40 hover:shadow-sm transition-all duration-150 ${isArabic ? "text-right" : ""}`}
              >
                <div className="text-[12px] uppercase tracking-wider font-semibold text-accent mb-1.5">
                  {t(result.typeKey)}
                </div>
                <div className="font-serif text-lg text-primary group-hover:text-accent transition-colors">
                  {lang === "ar" ? result.titleAr : result.title}
                </div>
                {(lang === "ar" ? result.excerptAr : result.excerpt) && (
                  <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {lang === "ar" ? result.excerptAr : result.excerpt}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-20 text-muted-foreground">
            {isArabic
              ? `لم يتم العثور على نتائج لـ "${query}". حاول كلمات مختلفة.`
              : `No results for "${query}". Try different keywords.`}
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
