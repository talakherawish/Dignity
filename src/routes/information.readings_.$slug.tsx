import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ReadingsBrowser, type ReadingFilters } from "@/components/ReadingsBrowser";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { RichText, FormattedText } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";
import { hasProse, formatted } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { readingItemsQuery, readingListQuery } from "@/lib/queries";

const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);

// "readings_" rather than "readings": the trailing underscore keeps this page
// from nesting inside the list page's component, which has no <Outlet />.
export const Route = createFileRoute("/information/readings_/$slug")({
  loader: async ({ context, params }) => {
    const subject = await context.queryClient.ensureQueryData(readingListQuery(params.slug));
    if (subject) await context.queryClient.ensureQueryData(readingItemsQuery(subject.id));
  },
  validateSearch: (search: Record<string, unknown>): ReadingFilters => ({
    q: text(search.q),
    type: text(search.type),
    author: text(search.author),
    keyword: text(search.keyword),
    lang: text(search.lang),
  }),
  component: ReadingListPage,
});

/** One Readings and Documents subject: its description, then its readings. */
function ReadingListPage() {
  const { slug } = Route.useParams();
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  const { t, isArabic } = useLanguage();

  const { data: subject, isLoading: subjectLoading } = useQuery(readingListQuery(slug));
  const { data: readings = [], isLoading: readingsLoading } = useQuery({
    ...readingItemsQuery(subject?.id ?? ""),
    enabled: !!subject,
  });

  const title = formatted(subject, "title", isArabic);
  const description = subject && (isArabic ? subject.descriptionAr : subject.description);

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("information.readings")}
        eyebrowColor={SECTION_COLORS.information}
        title={
          subjectLoading ? "" : title.text ? <FormattedText {...title} /> : t("readings.empty")
        }
      />

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8" dir={isArabic ? "rtl" : "ltr"}>
        <Link
          to="/information/readings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[color:var(--brand-magenta)]"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("readings.back")}
        </Link>
        {hasProse(description) && (
          <RichText
            value={description}
            className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-foreground"
          />
        )}
      </div>

      {(subjectLoading || subject) && (
        <ReadingsBrowser
          readings={readings}
          isLoading={subjectLoading || readingsLoading}
          filters={filters}
          // replace: filtering shouldn't fill the back button with every
          // keystroke typed into the search box.
          onFiltersChange={(next) => navigate({ search: next, replace: true })}
        />
      )}
    </PageLayout>
  );
}
