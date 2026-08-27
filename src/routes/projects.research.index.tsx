import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchResearch,
  extractText,
  mediaUrl,
  populated,
  type PayloadResearchActivity,
} from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";
export const Route = createFileRoute("/projects/research/")({
  head: () => ({ meta: [{ title: "Research — Dignity" }] }),
  component: ResearchPage,
});

/**
 * Count of outputs attached to a research area, for the card's footer.
 *
 * Publications arrive split across one field per type (there is no combined
 * `relatedPublications` on the collection), so every type has to be summed —
 * counting only clippings and photos undercounts every area that has any
 * publication attached.
 */
function outputCount(item: PayloadResearchActivity): number {
  // Typed as loosely as the work requires: these nine collections no longer
  // share a shape, and inference across the union picked one member and
  // rejected the rest. Counting needs no more than "is this a real document",
  // which is exactly what `populated` narrows to.
  const groups: ((string | object)[] | undefined)[] = [
    item.relatedBooks,
    item.relatedPapers,
    item.relatedReports,
    item.relatedBrochures,
    item.relatedTheses,
    item.relatedAudiovisual,
    item.relatedPosters,
    item.relatedClippings,
    item.relatedPhotos,
  ];
  // `populated` drops references whose document has been deleted; counting the
  // raw array instead promised outputs the detail page cannot render.
  return groups.reduce((total, group) => total + populated<object>(group).length, 0);
}

function ResearchPage() {
  const { lang, isArabic } = useLanguage();

  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["research"],
    queryFn: fetchResearch,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={isArabic ? "الأنشطة" : "Activities"}
        eyebrowColor={SECTION_COLORS.activities}
        title={isArabic ? "الأبحاث" : "Research"}
      />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="border border-border rounded-lg h-40 bg-secondary/30 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد أبحاث منشورة حالياً." : "No research areas published yet."}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item) => {
              const title = lang === "ar" ? (item.titleAr ?? item.title) : item.title;
              // description is a plain textarea on this collection, but extractText
              // handles both that and richText — see its guard.
              const desc = extractText(
                lang === "ar" ? (item.descriptionAr ?? item.description) : item.description,
              )[0];
              const image = mediaUrl(item.image);
              const outputs = outputCount(item);
              return (
                <Link
                  key={item.id}
                  to="/projects/research/$slug"
                  params={{ slug: item.slug ?? item.id }}
                  className={
                    "group flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-accent/40 hover:shadow-md transition-all duration-200" +
                    (isArabic ? " text-right" : "")
                  }
                >
                  {image && (
                    <div
                      className="w-full overflow-hidden bg-secondary/20"
                      style={{ aspectRatio: "16/9" }}
                    >
                      <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h2 className="font-serif text-lg text-primary leading-snug group-hover:text-accent transition-colors">
                      {title}
                    </h2>
                    {desc && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2 flex-1">
                        {desc}
                      </p>
                    )}
                    <div
                      className={
                        "mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-accent transition-colors" +
                        (isArabic ? " flex-row-reverse" : "")
                      }
                    >
                      <span>
                        {outputs > 0
                          ? isArabic
                            ? `${outputs} من المخرجات`
                            : `${outputs} output${outputs === 1 ? "" : "s"}`
                          : isArabic
                            ? "اقرأ المزيد"
                            : "Read more"}
                      </span>
                      <ArrowRight className={"h-3.5 w-3.5" + (isArabic ? " rotate-180" : "")} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
