import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchResearchBySlug,
  extractText,
  mediaUrl,
  formatDate,
  youtubeThumbnail,
  fetchPublicationsByType,
  fetchClippings,
  fetchPhotos,
  type PayloadResearchActivity,
  type PayloadPublication,
  type PayloadClipping,
  type PayloadPhoto,
} from "@/lib/payload";

export const Route = createFileRoute("/projects/research/$slug")({
  head: () => ({ meta: [{ title: "Research — Dignity" }] }),
  component: ResearchDetailPage,
});

/** Section wrapper for a group of attached outputs. */
function OutputSection({
  title,
  icon,
  isArabic,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isArabic: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className={"flex items-center gap-2.5 mb-5" + (isArabic ? " flex-row-reverse" : "")}>
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="font-serif text-4xl md:text-5xl text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PublicationCard({ item, lang, isArabic }: { item: PayloadPublication; lang: string; isArabic: boolean }) {
  const title = lang === "ar" ? (item.titleAr ?? item.title) : item.title;
  // Audiovisual entries are external links with no upload, so their preview
  // comes from the video id rather than a rasterised file.
  const poster = item.link ? youtubeThumbnail(item.link) : mediaUrl(item.image?.thumbnail ?? item.image);
  const href = item.link || mediaUrl(item.file);
  return (
    <a
      href={href || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "group block bg-card border border-border rounded-lg overflow-hidden hover:border-accent/40 hover:shadow-md transition-all duration-200" +
        (isArabic ? " text-right" : "")
      }
    >
      <div className="w-full bg-secondary/20 flex items-center justify-center overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {poster ? (
          <img src={poster} alt={title} className="w-full h-full object-cover" />
        ) : (
          <FileText className="h-10 w-10 text-muted-foreground/25" />
        )}
      </div>
      <div className="p-4">
        <div className="font-medium text-sm text-primary leading-snug group-hover:text-accent transition-colors">
          {title}
        </div>
        {item.date && (
          <div className="text-xs text-muted-foreground mt-1.5">
            {formatDate(item.date, lang === "ar" ? "ar" : "en")}
          </div>
        )}
        {href && (
          <div className={"mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground" + (isArabic ? " flex-row-reverse" : "")}>
            <Download className="h-3.5 w-3.5" />
            {isArabic ? "تحميل" : "Download"}
          </div>
        )}
      </div>
    </a>
  );
}

function ResearchDetailPage() {
  const { slug } = Route.useParams();
  const { lang, isArabic } = useLanguage();

  const { data: item, isLoading } = useQuery({
    queryKey: ["research", slug],
    queryFn: () => fetchResearchBySlug(slug),
    staleTime: 5 * 60 * 1000,
  });

  const { data: books = [] } = useQuery({
    queryKey: ["publications", "books"],
    queryFn: () => fetchPublicationsByType("books"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: papers = [] } = useQuery({
    queryKey: ["publications", "papers"],
    queryFn: () => fetchPublicationsByType("papers"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["publications", "reports"],
    queryFn: () => fetchPublicationsByType("reports"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: brochures = [] } = useQuery({
    queryKey: ["publications", "brochures"],
    queryFn: () => fetchPublicationsByType("brochures"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: theses = [] } = useQuery({
    queryKey: ["publications", "theses"],
    queryFn: () => fetchPublicationsByType("theses"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: audiovisual = [] } = useQuery({
    queryKey: ["publications", "audiovisual"],
    queryFn: () => fetchPublicationsByType("audiovisual"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: posters = [] } = useQuery({
    queryKey: ["publications", "posters"],
    queryFn: () => fetchPublicationsByType("posters"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: clippings = [] } = useQuery({
    queryKey: ["clippings"],
    queryFn: fetchClippings,
    staleTime: 5 * 60 * 1000,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["photos"],
    queryFn: fetchPhotos,
    staleTime: 5 * 60 * 1000,
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
  const body = (() => {
    const full = extractText(lang === "ar" ? (research.contentAr ?? research.content) : research.content);
    if (full.length) return full;
    return extractText(lang === "ar" ? (research.descriptionAr ?? research.description) : research.description);
  })();

  return (
    <PageLayout>
      <article className={"max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in" + (isArabic ? " text-right" : "")}>
        {backLink}

        <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mt-8 mb-3">
          {isArabic ? "الأنشطة — الأبحاث" : "Activities — Research"}
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-primary tracking-tight leading-tight">{title}</h1>

        {image && (
          <img src={image} alt={title} className="w-full rounded-lg mt-8 object-cover" style={{ maxHeight: "26rem" }} />
        )}

        {body.length > 0 ? (
          <div className="mt-8 space-y-5 text-base leading-[1.85] text-foreground/90 opacity-0 animate-[fadeIn_0.8s_ease-in-out_0.3s_forwards]">
            {body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            {isArabic ? "المحتوى قادم قريباً." : "Content coming soon."}
          </p>
        )}

        {(books.length > 0 || papers.length > 0 || reports.length > 0 || brochures.length > 0 || theses.length > 0 || audiovisual.length > 0 || posters.length > 0 || clippings.length > 0 || photos.length > 0) && (
          <section className="mt-16">
            <div className={"flex items-center gap-2.5 mb-8" + (isArabic ? " flex-row-reverse" : "")}>
              <span className="text-muted-foreground"><FileText className="h-5 w-5" /></span>
              <h2 className="font-serif text-4xl md:text-5xl text-primary">{isArabic ? "المخرجات" : "Outputs"}</h2>
            </div>

            {books.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-6">{isArabic ? "الكتب" : "Books"}</h3>
                <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
                  {books.map((p) => {
                    const fileUrl = p.file ? mediaUrl(p.file) : "";
                    const previewUrl = mediaUrl(p.image?.thumbnail) || mediaUrl(p.image) || mediaUrl(p.file?.thumbnail) || "";
                    return (
                      <div key={p.id} className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
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
                          <div className={"flex items-start justify-between gap-3 mt-auto" + (isArabic ? " flex-row-reverse text-right" : "")}>
                            <h4 className="font-serif text-sm text-primary leading-snug">{lang === "ar" ? (p.titleAr ?? p.title) : p.title}</h4>
                            {fileUrl && (
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
              </div>
            )}

            {papers.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-6">{isArabic ? "الأوراق البحثية" : "Papers"}</h3>
                <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
                  {papers.map((p) => {
                    const fileUrl = p.file ? mediaUrl(p.file) : "";
                    const previewUrl = mediaUrl(p.image?.thumbnail) || mediaUrl(p.image) || mediaUrl(p.file?.thumbnail) || "";
                    return (
                    <div key={p.id} className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
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
                        <div className={"flex items-start justify-between gap-3 mt-auto" + (isArabic ? " flex-row-reverse text-right" : "")}>
                          <h4 className="font-serif text-sm text-primary leading-snug">{lang === "ar" ? (p.titleAr ?? p.title) : p.title}</h4>
                          {fileUrl && (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label={isArabic ? "تحميل" : "Download"} title={isArabic ? "تحميل" : "Download"} className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {reports.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-6">{isArabic ? "التقارير" : "Reports"}</h3>
                <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
                  {reports.map((p) => {
                    const fileUrl = p.file ? mediaUrl(p.file) : "";
                    const previewUrl = mediaUrl(p.image?.thumbnail) || mediaUrl(p.image) || mediaUrl(p.file?.thumbnail) || "";
                    return (
                    <div key={p.id} className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
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
                        <div className={"flex items-start justify-between gap-3 mt-auto" + (isArabic ? " flex-row-reverse text-right" : "")}>
                          <h4 className="font-serif text-sm text-primary leading-snug">{lang === "ar" ? (p.titleAr ?? p.title) : p.title}</h4>
                          {fileUrl && (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label={isArabic ? "تحميل" : "Download"} title={isArabic ? "تحميل" : "Download"} className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {brochures.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-6">{isArabic ? "الكتيبات" : "Brochures"}</h3>
                <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
                  {brochures.map((p) => {
                    const fileUrl = p.file ? mediaUrl(p.file) : "";
                    const previewUrl = mediaUrl(p.image?.thumbnail) || mediaUrl(p.image) || mediaUrl(p.file?.thumbnail) || "";
                    return (
                    <div key={p.id} className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
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
                        <div className={"flex items-start justify-between gap-3 mt-auto" + (isArabic ? " flex-row-reverse text-right" : "")}>
                          <h4 className="font-serif text-sm text-primary leading-snug">{lang === "ar" ? (p.titleAr ?? p.title) : p.title}</h4>
                          {fileUrl && (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label={isArabic ? "تحميل" : "Download"} title={isArabic ? "تحميل" : "Download"} className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {theses.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-6">{isArabic ? "الرسائل العلمية" : "Theses"}</h3>
                <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
                  {theses.map((p) => {
                    const previewUrl = mediaUrl(p.image?.thumbnail) || mediaUrl(p.image) || mediaUrl(p.file?.thumbnail) || "";
                    return (
                    <div key={p.id} className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
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
                        <h4 className="font-serif text-sm text-primary leading-snug">{lang === "ar" ? (p.titleAr ?? p.title) : p.title}</h4>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {audiovisual.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-6">{isArabic ? "محتوى مرئي" : "Audiovisual"}</h3>
                <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
                  {audiovisual.map((p) => {
                    const previewUrl = mediaUrl(p.image?.thumbnail) || mediaUrl(p.image) || mediaUrl(p.file?.thumbnail) || youtubeThumbnail(p.link) || "";
                    return (
                    <div key={p.id} className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
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
                        <h4 className="font-serif text-sm text-primary leading-snug">{lang === "ar" ? (p.titleAr ?? p.title) : p.title}</h4>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {posters.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-6">{isArabic ? "الملصقات" : "Posters"}</h3>
                <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
                  {posters.map((p) => {
                    const previewUrl = mediaUrl(p.image?.thumbnail) || mediaUrl(p.image) || mediaUrl(p.file?.thumbnail) || "";
                    return (
                    <div key={p.id} className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
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
                        <h4 className="font-serif text-sm text-primary leading-snug">{lang === "ar" ? (p.titleAr ?? p.title) : p.title}</h4>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {clippings.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-6">{isArabic ? "قصاصات صحفية" : "Press Clippings"}</h3>
                <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
                  {clippings.map((c: PayloadClipping) => {
                    const url = mediaUrl(c.image);
                    const isImage = c.image?.mimeType?.startsWith("image/") ?? false;
                    const thumbnailUrl = c.image?.thumbnail ? mediaUrl(c.image.thumbnail) : "";
                    const previewUrl = isImage ? url : thumbnailUrl;
                    return (
                      <div key={c.id} className="w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
                        {url && (
                          <div className="aspect-[3/4] bg-secondary/20 flex items-center justify-center">
                            {previewUrl ? (
                              <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="h-10 w-10 text-muted-foreground/50" />
                            )}
                          </div>
                        )}
                        <div className="p-4 flex flex-col flex-1">
                          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                            {formatDate(c.date, lang === "ar" ? "ar" : "en")}
                          </div>
                          <h4 className="font-serif text-sm text-primary leading-snug">{lang === "ar" ? (c.titleAr ?? c.title) : c.title}</h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {photos.length > 0 && (
              <div>
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-6">{isArabic ? "صور" : "Photos"}</h3>
                <div className="flex flex-wrap justify-center gap-6" dir={isArabic ? "rtl" : "ltr"}>
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
              </div>
            )}
          </section>
        )}
      </article>
    </PageLayout>
  );
}
