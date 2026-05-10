import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { ARTICLES, getField, getBody, type Article, type ArticleLang } from "@/data/articles";

export const Route = createFileRoute("/media/news")({
  head: () => ({ meta: [{ title: "News — Dignity" }] }),
  component: NewsPage,
});

function ArticleCard({ article }: { article: Article }) {
  const { t, lang, isArabic } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const l = lang as ArticleLang;

  return (
    <article className="border border-border rounded-sm overflow-hidden bg-card hover:shadow-md transition-shadow duration-200">
      <div className="grid md:grid-cols-[2fr_3fr]">
        {/* Image */}
        <div style={{ aspectRatio: "4/3" }} className="overflow-hidden">
          <img
            src={article.image}
            alt={getField(article, "title", l)}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Summary */}
        <div className="p-7 lg:p-9 flex flex-col">
          <div className="mb-auto">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-3">
              {getField(article, "date", l)}
            </p>
            <h2 className={`font-serif text-xl lg:text-2xl text-primary mb-3 leading-snug ${isArabic ? "text-right" : ""}`}>
              {getField(article, "title", l)}
            </h2>
            <p className={`text-sm text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
              {getField(article, "excerpt", l)}
            </p>
          </div>

          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-6 self-start flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            {expanded ? t("news.collapse") : t("news.readMore")}
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform duration-300"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>
        </div>
      </div>

      {/* Expandable body */}
      <div
        className="overflow-hidden"
        style={{
          maxHeight: expanded ? "4000px" : "0px",
          transition: expanded
            ? "max-height 0.6s ease-in"
            : "max-height 0.4s ease-out",
        }}
      >
        <div
          className="px-7 lg:px-9 pb-9 pt-6 border-t border-border"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className={`space-y-4 max-w-3xl ${isArabic ? "mr-0 ml-auto text-right" : ""}`}>
            {getBody(article, l).map((para, idx) => (
              <p key={idx} className="text-sm text-foreground/85 leading-loose">
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function NewsPage() {
  const { t } = useLanguage();
  return (
    <PageLayout>
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page header */}
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-1.5">
              {t("media")}
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-primary">
              {t("media.news")}
            </h1>
          </div>

          {/* Article list */}
          <div className="space-y-6">
            {ARTICLES.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
