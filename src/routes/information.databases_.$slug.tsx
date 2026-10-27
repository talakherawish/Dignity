import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { BibliographyBrowser, type BibliographyFilters } from "@/components/BibliographyBrowser";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { RichText, FormattedText } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";
import { hasProse, formatted } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { bibliographyEntriesQuery, databaseQuery } from "@/lib/queries";

const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);

// "databases_" rather than "databases": the trailing underscore keeps this page
// from nesting inside the list page's component, which has no <Outlet />.
export const Route = createFileRoute("/information/databases_/$slug")({
  loader: async ({ context, params }) => {
    const database = await context.queryClient.ensureQueryData(databaseQuery(params.slug));
    if (database) await context.queryClient.ensureQueryData(bibliographyEntriesQuery(database.id));
  },
  validateSearch: (search: Record<string, unknown>): BibliographyFilters => ({
    q: text(search.q),
    type: text(search.type),
    author: text(search.author),
    keyword: text(search.keyword),
    lang: text(search.lang),
    open: text(search.open),
  }),
  component: DatabasePage,
});

function DatabasePage() {
  const { slug } = Route.useParams();
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  const { t, isArabic } = useLanguage();

  const { data: database, isLoading: databaseLoading } = useQuery(databaseQuery(slug));
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    ...bibliographyEntriesQuery(database?.id ?? ""),
    enabled: !!database,
  });

  const title = formatted(database, "title", isArabic);
  const description = database && (isArabic ? database.descriptionAr : database.description);

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("information.databases")}
        eyebrowColor={SECTION_COLORS.information}
        title={
          databaseLoading ? "" : title.text ? <FormattedText {...title} /> : t("databases.empty")
        }
      />

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8" dir={isArabic ? "rtl" : "ltr"}>
        <Link
          to="/information/databases"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[color:var(--brand-magenta)]"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("databases.back")}
        </Link>
        {hasProse(description) && (
          <RichText
            value={description}
            className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-foreground"
          />
        )}
      </div>

      {(databaseLoading || database) && (
        <BibliographyBrowser
          entries={entries}
          isLoading={databaseLoading || entriesLoading}
          filters={filters}
          // replace: filtering shouldn't fill the back button with every
          // keystroke typed into the search box.
          onFiltersChange={(next) => navigate({ search: next, replace: true })}
        />
      )}
    </PageLayout>
  );
}
