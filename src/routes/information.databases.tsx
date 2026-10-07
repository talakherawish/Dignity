import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { extractText, fetchBibliographyCounts, fetchDatabases } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/information/databases")({
  component: DatabasesPage,
});

/**
 * Every annotated bibliography, one card each, leading to its own filterable
 * page (information.databases_.$slug.tsx). A database used to be a single item
 * with a link and a file, the same as a reading; it is now a whole list of
 * sources, after Muwatin's databases.
 */
function DatabasesPage() {
  const { t, lang, isArabic } = useLanguage();
  const { data: databases = [], isLoading } = useQuery({
    queryKey: ["databases"],
    queryFn: fetchDatabases,
  });
  const { data: counts = {} } = useQuery({
    queryKey: ["bibliography-counts"],
    queryFn: fetchBibliographyCounts,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("information")}
        eyebrowColor={SECTION_COLORS.information}
        title={t("information.databases")}
      />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2].map((n) => (
              <div key={n} className="h-48 animate-pulse rounded-sm bg-secondary/40" />
            ))}
          </div>
        ) : databases.length === 0 ? (
          <p className="border-t border-border py-16 text-center text-sm text-muted-foreground">
            {t("databases.empty")}
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2" dir={isArabic ? "rtl" : "ltr"}>
            {databases.map((database) => {
              const title = isArabic ? (database.titleAr ?? database.title) : database.title;
              const summary = extractText(isArabic ? database.descriptionAr : database.description)
                .join(" ")
                .trim();
              const count = counts[database.id];
              return (
                <Link
                  key={database.id}
                  to="/information/databases/$slug"
                  params={{ slug: database.slug ?? database.id }}
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
                      {t("databases.entries")}
                    </span>
                  )}
                  <h2 className="font-serif text-2xl leading-snug text-primary transition-colors duration-300 group-hover:text-[color:var(--brand-magenta)]">
                    {title}
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
