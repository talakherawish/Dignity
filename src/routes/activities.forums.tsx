import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActivityLedger } from "@/components/ActivityLedger";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { fetchForums, type ForumType } from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

type FilterValue = "all" | ForumType;

/** ?type=seminar (etc) preselects a tab -- used by the old /activities/seminars
 * and /activities/conferences links, which redirect here (see those routes). */
type ForumsSearch = { type?: FilterValue };

export const Route = createFileRoute("/activities/forums")({
  head: () => ({ meta: [{ title: "Forums — Dignity" }] }),
  validateSearch: (search: Record<string, unknown>): ForumsSearch => {
    const forumTypes: readonly string[] = ["seminar", "roundtable", "workshop", "conference"];
    return {
      type: forumTypes.includes(search.type as string) ? (search.type as ForumType) : undefined,
    };
  },
  component: ForumsPage,
});

const FILTERS: { value: FilterValue; labelKey: TranslationKey }[] = [
  { value: "all", labelKey: "forums.filter.all" },
  { value: "seminar", labelKey: "forums.filter.seminar" },
  { value: "roundtable", labelKey: "forums.filter.roundtable" },
  { value: "workshop", labelKey: "forums.filter.workshop" },
  { value: "conference", labelKey: "forums.filter.conference" },
];

function ForumsPage() {
  const { t, isArabic } = useLanguage();
  const { type } = Route.useSearch();
  const [active, setActive] = useState<FilterValue>(type ?? "all");

  // No staleTime: an editor publishing or unpublishing something in the
  // admin expects to see it reflected on the next load, not up to five
  // minutes later.
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["forums"],
    queryFn: fetchForums,
  });

  const filtered = active === "all" ? items : items.filter((item) => item.forumType === active);

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("activities")}
        eyebrowColor={SECTION_COLORS.activities}
        title={t("activities.forums")}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div
          className={"flex flex-wrap gap-2" + (isArabic ? " justify-end" : "")}
          dir={isArabic ? "rtl" : "ltr"}
        >
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActive(filter.value)}
              className={[
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
                active === filter.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-accent hover:text-accent bg-background",
                isArabic ? "font-arabic" : "",
              ].join(" ")}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <ActivityLedger items={filtered} isLoading={isLoading} empty={t("forums.empty")} />
    </PageLayout>
  );
}
