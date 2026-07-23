import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchClippings, formatDate, mediaUrl, type PayloadClipping } from "@/lib/payload";
import { usePage } from "@/hooks/usePage";

export const Route = createFileRoute("/media/clippings")({
  head: () => ({ meta: [{ title: "Clippings — Dignity" }] }),
  component: ClippingsPage,
});

function ClippingsPage() {
  const { t, lang, isArabic } = useLanguage();
      const page = usePage("clippings");
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["clippings"],
    queryFn: fetchClippings,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout>
            <PageHero eyebrow={t("media")} title={page.title ?? t("media.clippings")} description={page.description ?? t("clippings.page.desc")} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="border border-border rounded-sm h-96 bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {isArabic ? "لا توجد مقالات صحفية منشورة حالياً." : "No clippings published yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" dir={isArabic ? "rtl" : "ltr"}>
            {items.map((item: PayloadClipping) => {
              const url = mediaUrl(item.image);
              const isImage = item.image?.mimeType?.startsWith("image/") ?? false;
              const thumbnailUrl = item.image?.thumbnail ? mediaUrl(item.image.thumbnail) : "";
              const previewUrl = isImage ? url : thumbnailUrl;
              return (
                <div key={item.id} className="border border-border rounded-sm bg-card overflow-hidden hover:shadow-sm transition-shadow flex flex-col">
                  {url && (
                    <div className="aspect-[1/1.41] bg-secondary/20 flex items-center justify-center">
                      {previewUrl ? (
                        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="h-10 w-10 text-muted-foreground/50" />
                      )}
                    </div>
                  )}
                  <div className={"p-5 flex flex-col flex-1"}>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                      {formatDate(item.date, lang === "ar" ? "ar" : "en")}
                    </div>
                    <div className={"flex items-start justify-between gap-3 mt-auto" + (isArabic ? " flex-row-reverse text-right" : "")}>
                      <h3 className="font-serif text-lg text-primary leading-snug">
                        {lang === "ar" ? (item.titleAr ?? item.title) : item.title}
                      </h3>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t("publications.download")}
                          title={t("publications.download")}
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
        )}
      </section>
    </PageLayout>
  );
}
