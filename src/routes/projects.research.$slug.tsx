import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { PhotoGallery, type GalleryPhoto } from "@/components/PhotoGallery";
import { PublicationCard, PublicationCardGrid } from "@/components/PublicationCard";
import { RichText } from "@/components/RichText";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchResearchBySlug,
  hasProse,
  mediaUrl,
  populated,
  youtubeThumbnail,
  type PayloadResearchActivity,
  type PayloadClipping,
  type PayloadPhoto,
  type PayloadPublication,
} from "@/lib/payload";

/**
 * One output group — the heading is a toggle and the grid below it starts
 * collapsed. Callers only mount a section when its collection has items, so a
 * visible heading always has something behind it to open.
 */
function OutputSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-5 text-start group cursor-pointer"
      >
        <h3 className="font-serif text-2xl md:text-3xl text-primary group-hover:text-accent transition-colors">
          {title}
          <span className="text-base text-muted-foreground ms-2">({count})</span>
        </h3>
        <ChevronDown
          className={
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" +
            (open ? " rotate-180" : "")
          }
        />
      </button>
      {open && <div className="pb-10">{children}</div>}
    </div>
  );
}

/** The card grid shared by all seven publication collections. */
function PublicationGrid({
  items,
  showDownload,
}: {
  items: PayloadPublication[];
  showDownload?: boolean;
}) {
  return (
    <PublicationCardGrid>
      {items.map((p) => {
        // A manually-set cover image wins; otherwise the auto-generated PDF
        // page-1 thumbnail, wherever it's attached. Its own dimensions travel
        // with it so the card shows it at its own proportions rather than
        // cropping it into a fixed box.
        const previewSource = p.image?.thumbnail ?? p.image ?? p.file?.thumbnail;
        const previewUrl = previewSource ? mediaUrl(previewSource) : youtubeThumbnail(p.link);
        return (
          <PublicationCard
            key={p.id}
            as="h4"
            title={p.title}
            titleAr={p.titleAr}
            author={p.author}
            authorAr={p.authorAr}
            date={p.date}
            previewUrl={previewUrl}
            previewWidth={previewSource?.width}
            previewHeight={previewSource?.height}
            fileUrl={showDownload && p.file ? mediaUrl(p.file) : ""}
            fileMimeType={showDownload ? p.file?.mimeType : undefined}
            fileUrlAr={showDownload && p.fileAr ? mediaUrl(p.fileAr) : ""}
            fileMimeTypeAr={showDownload ? p.fileAr?.mimeType : undefined}
            // Audiovisual entries are a link rather than an upload. Without this
            // they rendered as a bare thumbnail: no play button, nothing
            // clickable, no way to reach the video the entry exists to point at.
            linkUrl={p.link ?? ""}
            linkUrlAr={p.linkAr ?? ""}
          />
        );
      })}
    </PublicationCardGrid>
  );
}

export const Route = createFileRoute("/projects/research/$slug")({
  head: () => ({ meta: [{ title: "Research — Dignity" }] }),
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
      label: isArabic ? "الملصقات" : "Posters",
      items: populated<PayloadPublication>(research.relatedPosters),
    },
  ];

  const hasOutputs =
    publicationSections.some((s) => s.items.length > 0) ||
    clippings.length > 0 ||
    photos.length > 0;

  return (
    <PageLayout>
      <article
        className={
          "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in" +
          (isArabic ? " text-right" : "")
        }
      >
        {backLink}

        <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mt-8 mb-3">
          {isArabic ? "الأنشطة — الأبحاث" : "Activities — Research"}
        </div>
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
                      .map((p: PayloadPhoto): GalleryPhoto => {
                        const caption = lang === "ar" ? (p.titleAr ?? p.title) : p.title;
                        return {
                          id: p.id,
                          url: mediaUrl(p.image),
                          caption: caption || undefined,
                          date: p.date,
                          width: p.image?.width,
                          height: p.image?.height,
                        };
                      })
                      .filter((photo) => photo.url)}
                  />
                </OutputSection>
              )}
            </div>
          </section>
        )}
      </article>
    </PageLayout>
  );
}
