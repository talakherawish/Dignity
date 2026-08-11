import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import { ARTICLES, getField, getBody, mapPayloadNews, type Article } from "@/data/articles";
import { fetchNews } from "@/lib/payload";
import { withItalicQuotes } from "@/lib/text";

export const Route = createFileRoute("/media/news")({
  head: () => ({ meta: [{ title: "News — Dignity" }] }),
  component: NewsPage,
});

/**
 * The news archive, as an index rather than a stack of full-bleed cards.
 *
 * Each entry used to carry a banner image and its whole excerpt, so a single
 * story ran past the height of the screen and the page could only ever show
 * one thing at a time -- no sense of how much there was or what order it came
 * in. A row is now a date, a headline and a line of the excerpt; the picture
 * and the full text appear when the row is opened, which is where they are
 * actually being read.
 */

/** Capped in viewport units: a picture taller than the window cannot be seen. */
const ARTICLE_IMAGE = "max-h-[60vh] w-full object-cover aspect-[21/9]";

function ArticleRow({
  article,
  open,
  onToggle,
}: {
  article: Article;
  open: boolean;
  onToggle: () => void;
}) {
  const { t, lang, isArabic } = useLanguage();
  const paragraphs = getBody(article, lang);
  // Written up in the other language only. The row still opens, to say so.
  const untranslated =
    paragraphs.length === 0 && getBody(article, isArabic ? "en" : "ar").length > 0;
  const panelId = `news-panel-${article.id}`;
  const titleId = `news-title-${article.id}`;
  const excerpt = getField(article, "excerpt", lang);

  return (
    <li className="border-b border-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="group w-full cursor-pointer py-6 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-magenta)] focus-visible:ring-offset-2"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-magenta)]">
          {getField(article, "date", lang)}
        </p>
        <h2
          id={titleId}
          className="mt-2 font-serif text-lg leading-snug text-primary transition-colors duration-300 group-hover:text-[color:var(--brand-magenta)] md:text-xl"
        >
          {withItalicQuotes(getField(article, "title", lang))}
        </h2>
        {excerpt && (
          <p className="mt-1.5 line-clamp-1 text-sm leading-relaxed text-muted-foreground">
            {excerpt}
          </p>
        )}
        <span
          className={
            "mt-3 inline-block text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 " +
            (open
              ? "text-[color:var(--brand-magenta)]"
              : "text-muted-foreground group-hover:text-[color:var(--brand-magenta)]")
          }
        >
          {open ? t("news.collapse") : t("news.readMore")}
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={titleId}
        inert={!open}
        className={
          "grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none " +
          (open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
        }
      >
        <div className="overflow-hidden">
          <div className="pb-9">
            {article.image && (
              <div className="mb-6 overflow-hidden rounded-sm border border-border">
                <img
                  src={article.image}
                  alt={getField(article, "title", lang)}
                  loading="lazy"
                  className={ARTICLE_IMAGE}
                />
              </div>
            )}
            {excerpt && (
              <p className="mb-4 font-serif text-[15px] leading-relaxed text-foreground/80 md:text-base">
                {excerpt}
              </p>
            )}
            <div className="max-w-3xl space-y-4">
              {untranslated ? (
                <TranslationNotice />
              ) : (
                paragraphs.map((para, index) => (
                  <p key={index} className="text-sm leading-loose text-foreground/85">
                    {para}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function NewsSkeleton() {
  return (
    <ul className="border-t border-border">
      {[1, 2, 3, 4, 5].map((n) => (
        <li key={n} className="space-y-2 border-b border-border py-6">
          <div className="h-2.5 w-24 animate-pulse rounded-sm bg-secondary/40" />
          <div className="h-5 w-3/4 animate-pulse rounded-sm bg-secondary/50" />
          <div className="h-3 w-1/2 animate-pulse rounded-sm bg-secondary/40" />
        </li>
      ))}
    </ul>
  );
}

function NewsPage() {
  const { t, isArabic } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: payloadNews = [], isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000,
  });
  const articles = payloadNews.length > 0 ? payloadNews.map(mapPayloadNews) : ARTICLES;

  return (
    <PageLayout>
      <PageHero eyebrow={t("media")} title={t("media.news")} />
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {isLoading ? (
          <NewsSkeleton />
        ) : articles.length === 0 ? (
          <p className="border-t border-border py-16 text-center text-sm text-muted-foreground">
            {isArabic ? "لا توجد أخبار منشورة حالياً." : "No news published yet."}
          </p>
        ) : (
          <ul className="border-t border-border" dir={isArabic ? "rtl" : "ltr"}>
            {articles.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                open={openId === article.id}
                onToggle={() =>
                  setOpenId((current) => (current === article.id ? null : article.id))
                }
              />
            ))}
          </ul>
        )}
      </section>
    </PageLayout>
  );
}
