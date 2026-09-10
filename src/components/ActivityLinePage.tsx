import { useQuery } from "@tanstack/react-query";
import { ForumGrid, OutputSection, PublicationGrid } from "./OutputSection";
import { PageLayout } from "./PageLayout";
import { RichText } from "./RichText";
import { TranslationNotice } from "./TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchActivityLine,
  hasProse,
  mediaUrl,
  populated,
  type ActivityLine,
  type PayloadActivity,
  type PayloadPublication,
} from "@/lib/payload";

/**
 * Task Force on AI and Idea Factory, laid out exactly like a Research area's
 * own page (see projects.research.$slug.tsx): eyebrow, title, write-up, then
 * its outputs -- except there's no single "Outputs" heading over them here.
 * They're just called what they are, Activities and Publications, each its
 * own collapsible section, newest first. Both pages share this one
 * component (parameterized by which activity line to fetch) so they can't
 * drift into two slightly different implementations of the same page.
 */
export function ActivityLinePage({
  activityLine,
  eyebrow,
  fallbackTitle,
}: {
  activityLine: ActivityLine;
  eyebrow?: string;
  fallbackTitle: string;
}) {
  const { lang, isArabic } = useLanguage();

  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: item, isLoading } = useQuery({
    queryKey: ["activity-line", activityLine],
    queryFn: () => fetchActivityLine(activityLine),
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-8 w-2/3 bg-secondary/40 rounded animate-pulse" />
          <div className="h-4 w-full bg-secondary/30 rounded animate-pulse mt-6" />
          <div className="h-4 w-5/6 bg-secondary/30 rounded animate-pulse mt-3" />
        </div>
      </PageLayout>
    );
  }

  const title = item ? (lang === "ar" ? (item.titleAr ?? item.title) : item.title) : fallbackTitle;
  const image = mediaUrl(item?.image);
  // Full write-up if there is one, otherwise the short description -- in the
  // visitor's own language only, matching how a Research area's page reads.
  const fullContent = lang === "ar" ? item?.contentAr : item?.content;
  const shortDescription = lang === "ar" ? item?.descriptionAr : item?.description;
  const body = hasProse(fullContent) ? fullContent : shortDescription;
  const untranslated =
    !hasProse(body) &&
    (hasProse(lang === "ar" ? item?.content : item?.contentAr) ||
      hasProse(lang === "ar" ? item?.description : item?.descriptionAr));

  const forums = populated<PayloadActivity>(item?.relatedForums);
  const publications = [
    ...populated<PayloadPublication>(item?.relatedBooks),
    ...populated<PayloadPublication>(item?.relatedPapers),
    ...populated<PayloadPublication>(item?.relatedReports),
    ...populated<PayloadPublication>(item?.relatedBrochures),
    ...populated<PayloadPublication>(item?.relatedTheses),
    ...populated<PayloadPublication>(item?.relatedAudiovisual),
    ...populated<PayloadPublication>(item?.relatedPosters),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <PageLayout>
      <article
        className={
          "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in" +
          (isArabic ? " text-right" : "")
        }
      >
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-3">
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif text-3xl md:text-4xl text-primary tracking-tight leading-tight">
          {title}
        </h1>

        {image && (
          <img
            src={image}
            alt={title}
            className="w-full rounded-lg mt-8 object-cover"
            style={{ maxHeight: "26rem" }}
          />
        )}

        {hasProse(body) ? (
          <RichText
            value={body}
            className="mt-8 space-y-5 text-base leading-[1.85] text-foreground/90 opacity-0 animate-[fadeIn_0.8s_ease-in-out_0.3s_forwards]"
          />
        ) : untranslated ? (
          <TranslationNotice className="mt-8" />
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            {isArabic ? "المحتوى قادم قريباً." : "Content coming soon."}
          </p>
        )}

        {(forums.length > 0 || publications.length > 0) && (
          <div className="mt-16 border-t border-border/60">
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
      </article>
    </PageLayout>
  );
}
