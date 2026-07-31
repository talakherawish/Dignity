import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Newspaper, Image as ImageIcon } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchResearchBySlug,
  extractText,
  mediaUrl,
  formatDate,
  youtubeThumbnail,
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
        <h2 className="font-serif text-xl text-primary">{title}</h2>
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

  const publications = research.relatedPublications ?? [];
  const clippings = research.relatedClippings ?? [];
  const photos = research.relatedPhotos ?? [];

  return (
    <PageLayout>
      <article className={"max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12" + (isArabic ? " text-right" : "")}>
        {backLink}

        <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mt-8 mb-3">
          {isArabic ? "الأنشطة — الأبحاث" : "Activities — Research"}
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-primary tracking-tight leading-tight">{title}</h1>

        {image && (
          <img src={image} alt={title} className="w-full rounded-lg mt-8 object-cover" style={{ maxHeight: "26rem" }} />
        )}

        {body.length > 0 ? (
          <div className="mt-8 space-y-5 text-base leading-[1.85] text-foreground/90">
            {body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            {isArabic ? "المحتوى قادم قريباً." : "Content coming soon."}
          </p>
        )}

        {publications.length > 0 && (
          <OutputSection
            title={isArabic ? "المنشورات" : "Publications"}
            icon={<FileText className="h-4 w-4" />}
            isArabic={isArabic}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {publications.map((p) => (
                <PublicationCard key={p.id} item={p} lang={lang} isArabic={isArabic} />
              ))}
            </div>
          </OutputSection>
        )}

        {clippings.length > 0 && (
          <OutputSection
            title={isArabic ? "قصاصات صحفية" : "Press clippings"}
            icon={<Newspaper className="h-4 w-4" />}
            isArabic={isArabic}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {clippings.map((c: PayloadClipping) => {
                const src = mediaUrl(c.image?.thumbnail ?? c.image);
                return (
                  <div key={c.id} className="bg-card border border-border rounded-lg overflow-hidden">
                    {src && (
                      <div className="w-full bg-secondary/20 overflow-hidden" style={{ aspectRatio: "4/3" }}>
                        <img src={src} alt={c.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="text-sm font-medium text-primary leading-snug">
                        {lang === "ar" ? (c.titleAr ?? c.title) : c.title}
                      </div>
                      {c.date && (
                        <div className="text-xs text-muted-foreground mt-1.5">
                          {formatDate(c.date, lang === "ar" ? "ar" : "en")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </OutputSection>
        )}

        {photos.length > 0 && (
          <OutputSection
            title={isArabic ? "صور" : "Photos"}
            icon={<ImageIcon className="h-4 w-4" />}
            isArabic={isArabic}
          >
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {photos.map((p: PayloadPhoto) => {
                const src = mediaUrl(p.image);
                return src ? (
                  <img
                    key={p.id}
                    src={src}
                    alt={lang === "ar" ? (p.titleAr ?? p.title) : p.title}
                    className="w-full rounded-md object-cover"
                    style={{ aspectRatio: "1/1" }}
                  />
                ) : null;
              })}
            </div>
          </OutputSection>
        )}
      </article>
    </PageLayout>
  );
}
