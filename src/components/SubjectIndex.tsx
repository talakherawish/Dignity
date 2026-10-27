import { Link } from "@tanstack/react-router";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { extractText, type PayloadDatabase, formatted } from "@/lib/payload";
import { pageTextQuery } from "@/lib/queries";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { FormattedText } from "@/components/RichText";

/**
 * A page of subjects, one card each, leading to the subject's own filterable
 * page: Information → Databases (annotated bibliographies) and Information →
 * Readings and Documents (reading lists). The heading and introduction come
 * from the page's own page-text global, edited at the top of its list in the
 * CMS; either may be empty, and the title falls back to the menu label.
 */
/** One of the entries in lib/queries, fetched on the server by the route's loader. */
type Query<T> = UseQueryOptions<T, Error, T, string[]>;

export function SubjectIndex({
  pageText,
  subjectsQuery,
  countsQuery,
  titleKey,
  emptyKey,
  countKey,
  to,
}: {
  pageText: "databases-page" | "readings-page";
  subjectsQuery: Query<PayloadDatabase[]>;
  countsQuery: Query<Record<string, number>>;
  titleKey: TranslationKey;
  emptyKey: TranslationKey;
  /** What a subject holds, after its count: "entries", "readings". */
  countKey: TranslationKey;
  to: "/information/databases/$slug" | "/information/readings/$slug";
}) {
  const { t, lang, isArabic } = useLanguage();
  const { data: subjects = [], isLoading } = useQuery(subjectsQuery);
  const { data: counts = {} } = useQuery(countsQuery);
  const { data: page } = useQuery(pageTextQuery(pageText));
  const pageTitle = (isArabic ? page?.titleAr : page?.title)?.trim();
  const pageIntro = (isArabic ? page?.introAr : page?.intro)?.trim();

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("information")}
        eyebrowColor={SECTION_COLORS.information}
        title={pageTitle || t(titleKey)}
        description={pageIntro || undefined}
      />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2].map((n) => (
              <div key={n} className="h-48 animate-pulse rounded-sm bg-secondary/40" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <p className="border-t border-border py-16 text-center text-sm text-muted-foreground">
            {t(emptyKey)}
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2" dir={isArabic ? "rtl" : "ltr"}>
            {subjects.map((subject) => {
              const title = formatted(subject, "title", isArabic);
              const summary = extractText(isArabic ? subject.descriptionAr : subject.description)
                .join(" ")
                .trim();
              const count = counts[subject.id];
              return (
                <Link
                  key={subject.id}
                  to={to}
                  params={{ slug: subject.slug ?? subject.id }}
                  className="group flex flex-col rounded-sm border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--brand-magenta)]/40 hover:shadow-md md:p-8"
                >
                  {count !== undefined && (
                    <span
                      className={
                        "mb-4 block uppercase tracking-[0.2em] text-[color:var(--brand-magenta)] " +
                        (isArabic ? "text-[15px]" : "text-[10px] md:text-[11px]")
                      }
                    >
                      {count.toLocaleString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US")}{" "}
                      {t(countKey)}
                    </span>
                  )}
                  <h2 className="font-serif text-2xl leading-snug text-primary transition-colors duration-300 group-hover:text-[color:var(--brand-magenta)]">
                    <FormattedText {...title} />
                  </h2>
                  {summary && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {summary}
                    </p>
                  )}
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-6 h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-[color:var(--brand-magenta)] rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
