import { useQuery } from "@tanstack/react-query";
import { OutputSection } from "./OutputSection";
import { PageLayout, PageHero } from "./PageLayout";
import { PublicationCard, PublicationCardGrid } from "./PublicationCard";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchActivityLineItems,
  mediaUrl,
  youtubeThumbnail,
  type ActivityLine,
  type PayloadActivityLineItem,
} from "@/lib/payload";

/** The card grid for one activity line's own items -- same card as every other publication-shaped grid on the site. */
function ItemGrid({ items }: { items: PayloadActivityLineItem[] }) {
  return (
    <PublicationCardGrid>
      {items.map((item) => {
        const previewSource = item.image?.thumbnail ?? item.image ?? item.file?.thumbnail;
        const previewUrl = previewSource ? mediaUrl(previewSource) : youtubeThumbnail(item.link);
        return (
          <PublicationCard
            key={item.id}
            as="h4"
            title={item.title}
            titleAr={item.titleAr}
            date={item.date}
            previewUrl={previewUrl}
            previewWidth={previewSource?.width}
            previewHeight={previewSource?.height}
            fileUrl={item.file ? mediaUrl(item.file) : ""}
            fileMimeType={item.file?.mimeType}
            fileUrlAr={item.fileAr ? mediaUrl(item.fileAr) : ""}
            fileMimeTypeAr={item.fileAr?.mimeType}
            fileSize={item.file?.filesize}
            fileSizeAr={item.fileAr?.filesize}
            linkUrl={item.link ?? ""}
            linkUrlAr={item.linkAr ?? ""}
          />
        );
      })}
    </PublicationCardGrid>
  );
}

/**
 * Task Force on AI and Idea Factory have no content of their own the way a
 * Research line does -- each is its own Payload collection (see
 * ActivityLines.ts), and every item in it carries a `parentCategory` that
 * puts it under this page's Activities or Publications section, both
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

  // No staleTime: an editor publishing a new item in the admin expects to
  // see it here on the next load, not up to five minutes later.
  const { data: items = [] } = useQuery({
    queryKey: ["activity-line", activityLine],
    queryFn: () => fetchActivityLineItems(activityLine),
  });

  const activities = items.filter((i) => i.parentCategory === "activities");
  const publications = items.filter((i) => i.parentCategory === "publications");
  const isEmpty = activities.length === 0 && publications.length === 0;

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
            {isArabic ? "لا توجد عناصر مضافة هنا بعد." : "Nothing has been added here yet."}
          </p>
        ) : (
          <div className="border-t border-border/60">
            {activities.length > 0 && (
              <OutputSection title={isArabic ? "الأنشطة" : "Activities"} count={activities.length}>
                <ItemGrid items={activities} />
              </OutputSection>
            )}
            {publications.length > 0 && (
              <OutputSection
                title={isArabic ? "المنشورات" : "Publications"}
                count={publications.length}
              >
                <ItemGrid items={publications} />
              </OutputSection>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
