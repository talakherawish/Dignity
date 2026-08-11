import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import { ARTICLES, getField, getBody, mapPayloadNews, type Article } from "@/data/articles";
import { fetchNews } from "@/lib/payload";
import { withItalicQuotes } from "@/lib/text";

export const Route = createFileRoute("/media/news")({
  head: () => ({ meta: [{ title: "News — Dignity" }] }),
  component: NewsPage,
});

function ArticleCard({ article }: { article: Article }) {
  const { t, lang, isArabic } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const l = lang;
  const paragraphs = getBody(article, l);
  // Written up in the other language only. The card still opens -- there is
  // something here, it just is not in this language yet.
  const untranslated =
    paragraphs.length === 0 && getBody(article, isArabic ? "en" : "ar").length > 0;
  const panelId = `news-panel-${article.id}`;
  const titleId = `news-title-${article.id}`;

  return (
    <article className="border border-border rounded-sm overflow-hidden bg-card hover:shadow-md transition-shadow duration-200">
      {/*
       * One column, not an image beside a text panel. The split made every
       * card two things read at once, and since the image is optional the
       * cards did not even agree on which shape they were -- some in two
       * columns, some in one. A banner across the top is the same card either
       * way, and the headline always starts in the same place.
       */}
      <div>
        {article.image && (
          <div className="overflow-hidden" style={{ aspectRatio: "21/9" }}>
            <img
              src={article.image}
              alt={getField(article, "title", l)}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-7 lg:p-9 flex flex-col">
          <div className="mb-auto">
            <p className="text-[12px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-3">
              {getField(article, "date", l)}
            </p>
            <h2
              id={titleId}
              className={
                "font-serif text-xl lg:text-2xl text-primary mb-3 leading-snug" +
                (isArabic ? " text-right" : "")
              }
            >
              {withItalicQuotes(getField(article, "title", l))}
            </h2>
            <p
              className={
                "text-sm text-muted-foreground leading-relaxed" + (isArabic ? " text-right" : "")
              }
            >
              {getField(article, "excerpt", l)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-controls={panelId}
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
      {/*
       * The panel animates its own height rather than a max-height guess.
       * It used to run 0 -> 4000px: a short article finished opening in the
       * first fraction of the transition and then sat still for the rest of
       * it, and on the way back nothing moved until the last moment, when the
       * card slammed shut. A 0fr -> 1fr grid row is the content's real height,
       * so both directions take the time they appear to take.
       */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={titleId}
        inert={!expanded}
        className={
          "grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none " +
          (expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
        }
      >
        <div className="overflow-hidden">
          <div
            className="px-7 lg:px-9 pb-9 pt-6 border-t border-border"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className={"space-y-4 max-w-3xl" + (isArabic ? " mr-0 ml-auto text-right" : "")}>
              {untranslated ? (
                <TranslationNotice />
              ) : (
                paragraphs.map((para, idx) => (
                  <p key={idx} className="text-sm text-foreground/85 leading-loose">
                    {para}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function NewsPage() {
  const { t } = useLanguage();
  const { data: payloadNews = [], isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000,
  });
  const articles = payloadNews.length > 0 ? payloadNews.map(mapPayloadNews) : ARTICLES;

  return (
    <PageLayout>
      <section className="border-b border-border">
        {/*
         * text-center belongs to the page heading, not to the whole column.
         * On the column it was inherited by every card: the Arabic side put it
         * right again with its own text-right, so only the English cards were
         * affected -- date, headline, excerpt and whole paragraphs of body
         * copy, all centred.
         */}
        {/*
         * A reading column, not the site's full 7xl width. With the image no
         * longer taking half the card, body copy across 1280px would run to
         * well over a hundred characters a line.
         */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8 text-center">
            <p className="text-[12px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-1.5">
              {t("media")}
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-primary">{t("media.news")}</h1>
          </div>
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="border border-border rounded-sm h-48 bg-secondary/30 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
