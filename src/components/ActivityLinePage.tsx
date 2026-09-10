import { useQuery } from "@tanstack/react-query";
import { OutputSection, PublicationGrid, ForumGrid } from "./OutputSection";
import { PageLayout, PageHero } from "./PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchForumsByActivityLine,
  fetchPublicationsForActivityLine,
  type ActivityLine,
} from "@/lib/payload";

/**
 * Task Force on AI and Idea Factory have no content of their own the way a
 * Research line does -- they're a page of tagged Forums (their Activities
 * section) and tagged Publications (their Publications section), sorted
 * newest first, in the same collapsible OutputSection design the Research
 * area detail page uses (see src/components/OutputSection.tsx). One shared
 * component so the two pages can't drift apart into two slightly different
 * implementations of the same idea.
 */
export function ActivityLinePage({
  activityLine,
  eyebrow,
  eyebrowColor,
  title,
  description,
}: {
  activityLine: ActivityLine;
  eyebrow?: string;
  eyebrowColor?: string;
  title: string;
  description?: string;
}) {
  const { isArabic } = useLanguage();

  // No staleTime: an editor tagging an item in the admin expects to see it
  // here on the next load, not up to five minutes later.
  const { data: forums = [] } = useQuery({
    queryKey: ["activity-line-forums", activityLine],
    queryFn: () => fetchForumsByActivityLine(activityLine),
  });
  const { data: publications = [] } = useQuery({
    queryKey: ["activity-line-publications", activityLine],
    queryFn: () => fetchPublicationsForActivityLine(activityLine),
  });

  const isEmpty = forums.length === 0 && publications.length === 0;

  return (
    <PageLayout>
      <PageHero
        eyebrow={eyebrow}
        eyebrowColor={eyebrowColor}
        title={title}
        description={description}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isEmpty ? (
          <p className="text-center text-sm text-muted-foreground py-16">
            {isArabic ? "لا توجد عناصر مضافة هنا بعد." : "Nothing has been tagged here yet."}
          </p>
        ) : (
          <div className="border-t border-border/60">
            {forums.length > 0 && (
              <OutputSection title={isArabic ? "الأنشطة" : "Activities"} count={forums.length}>
                <ForumGrid items={forums} />
              </OutputSection>
            )}
            {publications.length > 0 && (
              <OutputSection
                title={isArabic ? "المنشورات" : "Publications"}
                count={publications.length}
              >
                <PublicationGrid items={publications} showDownload />
              </OutputSection>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
