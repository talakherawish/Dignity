import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Download, FileText } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { RichText } from "@/components/RichText";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import {
  fetchResearchBySlug,
  hasProse,
  mediaUrl,
  formatDate,
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
  lang,
  isArabic,
  showDownload,
}: {
  items: PayloadPublication[];
  lang: Language;
  isArabic: boolean;
  showDownload?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
      {items.map((p) => {
        const fileUrl = p.file ? mediaUrl(p.file) : "";
        const previewUrl =
          mediaUrl(p.image?.thumbnail) ||
          mediaUrl(p.image) ||
          mediaUrl(p.file?.thumbnail) ||
          youtubeThumbnail(p.link) ||
          "";
        return (
          <div
            key={p.id}
            className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
          >
            <div className="aspect-[1/1.41] bg-secondary/20 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText className="h-10 w-10 text-muted-foreground/50" />
              )}
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                {formatDate(p.date, lang === "ar" ? "ar" : "en")}
                {(p.author || p.authorAr) && (
                  <span> · {lang === "ar" ? (p.authorAr ?? p.author) : p.author}</span>
                )}
              </div>
              <div
                className={
                  "flex items-start justify-between gap-3 mt-auto" +
                  (isArabic ? " flex-row-reverse text-right" : "")
                }
              >
                <h4 className="font-serif text-sm text-primary leading-snug">
                  {lang === "ar" ? (p.titleAr ?? p.title) : p.title}
                </h4>
                {showDownload && fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={isArabic ? "تحميل" : "Download"}
                    title={isArabic ? "تحميل" : "Download"}
                    className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
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
  // Full write-up if there is one, otherwise the short description.
  const fullContent = lang === "ar" ? (research.contentAr ?? research.content) : research.content;
  const shortDescription =
    lang === "ar" ? (research.descriptionAr ?? research.description) : research.description;
  const body = hasProse(fullContent) ? fullContent : shortDescription;

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
                      <PublicationGrid
                        items={section.items}
                        lang={lang}
                        isArabic={isArabic}
                        showDownload={section.showDownload}
                      />
                    </OutputSection>
                  ),
              )}

              {clippings.length > 0 && (
                <OutputSection
                  title={isArabic ? "قصاصات صحفية" : "Press Clippings"}
                  count={clippings.length}
                >
                  <div
                    className="flex flex-wrap justify-center gap-6"
                    dir={isArabic ? "rtl" : "ltr"}
                  >
                    {clippings.map((c: PayloadClipping) => {
                      const url = mediaUrl(c.image);
                      const isImage = c.image?.mimeType?.startsWith("image/") ?? false;
                      const thumbnailUrl = c.image?.thumbnail ? mediaUrl(c.image.thumbnail) : "";
                      const previewUrl = isImage ? url : thumbnailUrl;
                      return (
                        <div
                          key={c.id}
                          className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
                        >
                          {url && (
                            <div className="aspect-[3/4] bg-secondary/20 flex items-center justify-center">
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText className="h-10 w-10 text-muted-foreground/50" />
                              )}
                            </div>
                          )}
                          <div className="p-4 flex flex-col flex-1">
                            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                              {formatDate(c.date, lang === "ar" ? "ar" : "en")}
                            </div>
                            <h4 className="font-serif text-sm text-primary leading-snug">
                              {lang === "ar" ? (c.titleAr ?? c.title) : c.title}
                            </h4>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </OutputSection>
              )}

              {photos.length > 0 && (
                <OutputSection title={isArabic ? "صور" : "Photos"} count={photos.length}>
                  <div
                    className="flex flex-wrap justify-center gap-6"
                    dir={isArabic ? "rtl" : "ltr"}
                  >
                    {photos.map((p: PayloadPhoto) => {
                      const src = mediaUrl(p.image);
                      return src ? (
                        <img
                          key={p.id}
                          src={src}
                          alt={lang === "ar" ? (p.titleAr ?? p.title) : p.title}
                          className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] rounded-sm object-cover hover:shadow-sm transition-shadow"
                          style={{ aspectRatio: "1/1" }}
                        />
                      ) : null;
                    })}
                  </div>
                </OutputSection>
              )}
            </div>
          </section>
        )}
      </article>
    </PageLayout>
  );
}
