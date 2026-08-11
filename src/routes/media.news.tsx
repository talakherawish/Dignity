import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

/**
 * One story shown large, with the rest as a numbered index beside it. Picking
 * a heading swaps the feature, and the heading for whatever is showing stays
 * marked, so the two halves always agree about which story is which.
 */

/**
 * The feature's height is capped in viewport units on purpose: a big picture
 * that runs past the top or bottom of the screen cannot be seen at all, and
 * the headline sits over the foot of it. clamp keeps it from collapsing on a
 * short window too.
 */
const FEATURE_HEIGHT = "h-[clamp(18rem,58vh,32rem)]";

function FeaturedStory({
  article,
  expanded,
  onToggle,
}: {
  article: Article;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t, lang, isArabic } = useLanguage();
  const paragraphs = getBody(article, lang);
  // Written up in the other language only. The story still opens, to say so.
  const untranslated =
    paragraphs.length === 0 && getBody(article, isArabic ? "en" : "ar").length > 0;
  const panelId = `news-panel-${article.id}`;
  const titleId = `news-title-${article.id}`;
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <article className="overflow-hidden rounded-sm border border-border bg-card">
      {/* Without a picture the gradient has nothing to darken, so the panel
          supplies its own ground rather than putting white text on white. */}
      <div className={"relative " + FEATURE_HEIGHT + (article.image ? "" : " bg-primary")}>
        {article.image && (
          <img
            src={article.image}
            alt={getField(article, "title", lang)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10"
        />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-9">
          <h2
            id={titleId}
            className="max-w-3xl font-serif text-2xl leading-tight text-white md:text-4xl"
          >
            {withItalicQuotes(getField(article, "title", lang))}
          </h2>
          <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/75">
            {getField(article, "excerpt", lang)}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/60">
              {getField(article, "date", lang)}
            </span>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={panelId}
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-70"
            >
              {expanded ? t("news.collapse") : t("news.readMore")}
              <Arrow
                className={
                  "h-3.5 w-3.5 transition-transform duration-300 motion-reduce:transition-none " +
                  (expanded ? "-rotate-90" : "")
                }
              />
            </button>
          </div>
        </div>
      </div>

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
          <div className="px-6 pt-7 pb-8 md:px-9 md:pb-10" dir={isArabic ? "rtl" : "ltr"}>
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
    </article>
  );
}

function StoryIndex({
  articles,
  activeId,
  onSelect,
}: {
  articles: Article[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { lang, isArabic } = useLanguage();

  return (
    <aside>
      <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {isArabic ? "أحدث الأخبار" : "Latest stories"}
      </p>
      <ul className="border-t border-border">
        {articles.map((article, index) => {
          const active = article.id === activeId;
          // Arabic-Indic numerals beside Arabic dates, Latin beside English.
          const number = (index + 1).toLocaleString(isArabic ? "ar-EG" : "en-US", {
            minimumIntegerDigits: 2,
          });

          return (
            <li key={article.id} className="border-b border-border">
              <button
                type="button"
                onClick={() => onSelect(article.id)}
                aria-current={active ? "true" : undefined}
                className={
                  "group flex w-full gap-4 border-s-2 py-5 ps-4 text-start transition-colors duration-300 " +
                  (active ? "border-[color:var(--brand-magenta)]" : "border-transparent")
                }
              >
                <span className="font-serif text-sm tabular-nums text-muted-foreground/70">
                  {number}
                </span>
                <span className="min-w-0">
                  <span
                    className={
                      "block font-serif text-[15px] leading-snug transition-colors duration-300 " +
                      (active
                        ? "text-[color:var(--brand-magenta)]"
                        : "text-primary group-hover:text-[color:var(--brand-magenta)]")
                    }
                  >
                    {withItalicQuotes(getField(article, "title", lang))}
                  </span>
                  <span className="mt-1.5 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {getField(article, "date", lang)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function NewsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-12">
      <div className={"animate-pulse rounded-sm bg-secondary/50 " + FEATURE_HEIGHT} />
      <div className="space-y-5 border-t border-border pt-5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded-sm bg-secondary/50" />
            <div className="h-3 w-20 animate-pulse rounded-sm bg-secondary/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsPage() {
  const { t, isArabic } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const { data: payloadNews = [], isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000,
  });
  const articles = payloadNews.length > 0 ? payloadNews.map(mapPayloadNews) : ARTICLES;

  // Falls back to the newest story, which also covers the first render and a
  // selection that no longer exists after a refetch.
  const featured = articles.find((article) => article.id === selectedId) ?? articles[0];

  return (
    <PageLayout>
      <section className="border-b border-border">
        <div
          className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className="mb-8 text-center">
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-magenta)]">
              {t("media")}
            </p>
            <h1 className="font-serif text-3xl text-primary md:text-4xl">{t("media.news")}</h1>
          </div>

          {isLoading ? (
            <NewsSkeleton />
          ) : !featured ? (
            <p className="border-t border-border py-16 text-center text-sm text-muted-foreground">
              {isArabic ? "لا توجد أخبار منشورة حالياً." : "No news published yet."}
            </p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-12">
              <FeaturedStory
                article={featured}
                expanded={expanded}
                onToggle={() => setExpanded((open) => !open)}
              />
              <StoryIndex
                articles={articles}
                activeId={featured.id}
                onSelect={(id) => {
                  setSelectedId(id);
                  // A story swapped underneath an open panel would leave the
                  // previous article's body on screen under a new headline.
                  setExpanded(false);
                }}
              />
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
