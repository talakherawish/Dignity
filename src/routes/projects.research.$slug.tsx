import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { OutputSection, PublicationGrid, ForumGrid } from "@/components/OutputSection";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { PhotoGallery, toGalleryPhoto } from "@/components/PhotoGallery";
import { PublicationCard, PublicationCardGrid } from "@/components/PublicationCard";
import { RichText } from "@/components/RichText";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchResearchBySlug,
  hasProse,
  mediaUrl,
  populated,
  type PayloadActivity,
  type PayloadResearchActivity,
  type PayloadClipping,
  type PayloadPhoto,
  type PayloadPublication,
} from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/projects/research/$slug")({
  component: ResearchDetailPage,
});

function ResearchDetailPage() {
  const { slug } = Route.useParams();
  const { lang, isArabic } = useLanguage();

  // No staleTime: an editor publishing a change in the admin expects to see it
  // on the next load, and React Query's default revalidate-on-mount plus
  // revalidate-on-focus gives exactly that. The five minutes this used to hold
  // meant a just-published edit could be invisible for that long.
  const { data: item, isLoading } = useQuery({
    queryKey: ["research", slug],
    queryFn: () => fetchResearchBySlug(slug),
  });

  const backLink = (
    <Link
      to="/projects/research"
      className={
        "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-accent transition-colors" +
        (isArabic ? " flex-row-reverse" : "")
      }
    >
      <ArrowLeft className={"h-3.5 w-3.5" + (isArabic ? " rotate-180" : "")} />
      {isArabic ? "كل الأبحاث" : "All research"}
    </Link>
  );

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

  if (!item) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-muted-foreground text-sm mb-6">
            {isArabic ? "لم يتم العثور على هذا البحث." : "That research area could not be found."}
          </p>
          {backLink}
        </div>
      </PageLayout>
    );
  }

  const research: PayloadResearchActivity = item;
  const title = lang === "ar" ? (research.titleAr ?? research.title) : research.title;
  const image = mediaUrl(research.image);
  // Full write-up if there is one, otherwise the short description -- in the
  // visitor's own language only, so an area written up in one language is
  // announced as untranslated rather than silently served in the other.
  const fullContent = lang === "ar" ? research.contentAr : research.content;
  const shortDescription = lang === "ar" ? research.descriptionAr : research.description;
  const body = hasProse(fullContent) ? fullContent : shortDescription;
  const untranslated =
    !hasProse(body) &&
    (hasProse(lang === "ar" ? research.content : research.contentAr) ||
      hasProse(lang === "ar" ? research.description : research.descriptionAr));

  // Outputs come from this entry's own selections in the admin — the
  // `related*` relationship fields — so the page shows what an editor attached
  // to this research area and nothing else. It previously fetched each
  // publication collection whole, which meant every research page listed every
  // publication on the site: deleting a report from this entry changed nothing
  // on screen, because the entry was never what the page was reading.
  const clippings = populated<PayloadClipping>(research.relatedClippings);
  const photos = populated<PayloadPhoto>(research.relatedPhotos);
  const forums = populated<PayloadActivity>(research.relatedForums);

  // The seven publication collections, in the order they appear under Outputs.
  // Theses, audiovisual and posters are listed without a download control.
  const publicationSections: {
    key: string;
    label: string;
    items: PayloadPublication[];
    showDownload?: boolean;
  }[] = [
    {
      key: "books",
      label: isArabic ? "الكتب" : "Books",
      items: populated<PayloadPublication>(research.relatedBooks),
      showDownload: true,
    },
    {
      key: "papers",
      label: isArabic ? "الأوراق البحثية" : "Papers",
      items: populated<PayloadPublication>(research.relatedPapers),
      showDownload: true,
    },
    {
      key: "reports",
      label: isArabic ? "التقارير" : "Reports",
      items: populated<PayloadPublication>(research.relatedReports),
      showDownload: true,
    },
    {
      key: "brochures",
      label: isArabic ? "الكتيبات" : "Brochures",
      items: populated<PayloadPublication>(research.relatedBrochures),
      showDownload: true,
    },
    {
      key: "theses",
      label: isArabic ? "الرسائل العلمية" : "Theses",
      items: populated<PayloadPublication>(research.relatedTheses),
    },
    {
      key: "audiovisual",
      label: isArabic ? "محتوى مرئي" : "Audiovisual",
      items: populated<PayloadPublication>(research.relatedAudiovisual),
    },
    {
      key: "posters",
      label: isArabic ? "معلّقات" : "Posters",
      items: populated<PayloadPublication>(research.relatedPosters),
    },
  ];

  const hasOutputs =
    publicationSections.some((s) => s.items.length > 0) ||
    clippings.length > 0 ||
    photos.length > 0 ||
    forums.length > 0;

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">{backLink}</div>

      <PageHero
        eyebrow={isArabic ? "نشاطات — المشاريع البحثية" : "Activities — Research Projects"}
        eyebrowColor={SECTION_COLORS.activities}
        title={title}
      />

      <article
        className={
          "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 animate-fade-in" +
          (isArabic ? " text-right" : "")
        }
      >
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

        {hasOutputs && (
          <section className="mt-16">
            <h2 className="font-serif text-4xl md:text-5xl text-primary mb-4">
              {isArabic ? "المخرجات" : "Outputs"}
            </h2>

            <div className="border-t border-border/60">
              {publicationSections.map(
                (section) =>
                  section.items.length > 0 && (
                    <OutputSection
                      key={section.key}
                      title={section.label}
                      count={section.items.length}
                    >
                      <PublicationGrid items={section.items} showDownload={section.showDownload} />
                    </OutputSection>
                  ),
              )}

              {clippings.length > 0 && (
                <OutputSection
                  title={isArabic ? "قصاصات صحفية" : "Press Clippings"}
                  count={clippings.length}
                >
                  <PublicationCardGrid>
                    {clippings.map((c: PayloadClipping) => {
                      const url = mediaUrl(c.image);
                      const isImage = c.image?.mimeType?.startsWith("image/") ?? false;
                      const previewSource = isImage ? c.image : c.image?.thumbnail;
                      return (
                        <PublicationCard
                          key={c.id}
                          as="h4"
                          title={c.title}
                          titleAr={c.titleAr}
                          date={c.date}
                          previewUrl={mediaUrl(previewSource)}
                          previewWidth={previewSource?.width}
                          previewHeight={previewSource?.height}
                          preview={url ? "clipping" : "none"}
                        />
                      );
                    })}
                  </PublicationCardGrid>
                </OutputSection>
              )}

              {photos.length > 0 && (
                <OutputSection title={isArabic ? "صور" : "Photos"} count={photos.length}>
                  <PhotoGallery
                    photos={photos
                      .map((p) => toGalleryPhoto(p, lang === "ar" ? "ar" : "en"))
                      .filter((photo) => photo.url)}
                  />
                </OutputSection>
              )}

              {forums.length > 0 && (
                <OutputSection title={isArabic ? "المنتديات" : "Forums"} count={forums.length}>
                  <ForumGrid items={forums} />
                </OutputSection>
              )}
            </div>
          </section>
        )}
      </article>
    </PageLayout>
  );
}
