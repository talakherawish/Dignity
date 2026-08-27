import type { Language } from "@/contexts/LanguageContext";
import { extractText, formatDate, mediaUrl, type PayloadNews } from "@/lib/payload";

/** The languages an article carries. Mirrors the site's active language set. */
export type ArticleLang = Language;

export type Article = {
  id: string;
  image: string;
  date: Record<ArticleLang, string>;
  title: Record<ArticleLang, string>;
  excerpt: Record<ArticleLang, string>;
  body: Record<ArticleLang, string[]>;
};

/** Adapt a Payload news entry to the local Article shape the homepage carousel and the news listing render. */
export function mapPayloadNews(pa: PayloadNews): Article {
  return {
    id: pa.id,
    image: mediaUrl(pa.image) || "",
    date: { en: formatDate(pa.date, "en"), ar: formatDate(pa.date, "ar") },
    title: { en: pa.title, ar: pa.titleAr ?? pa.title },
    excerpt: { en: pa.excerpt ?? "", ar: pa.excerptAr ?? pa.excerpt ?? "" },
    // Each language carries its own body, with no cross-language fallback:
    // an article written up in one language only is announced as untranslated
    // by the card rather than being served in the other language.
    body: {
      en: extractText(pa.content),
      ar: extractText(pa.contentAr),
    },
  };
}

/** Pick the localized field; falls back to English if the translation is blank. */
export function getField(
  article: Article,
  field: "date" | "title" | "excerpt",
  lang: ArticleLang,
): string {
  return article[field][lang] || article[field].en;
}

/** The body in this language. Empty when it has not been translated yet. */
export function getBody(article: Article, lang: ArticleLang): string[] {
  return article.body[lang] ?? [];
}

/**
 * True when the excerpt was written in the other language but not this one --
 * as opposed to no excerpt existing at all, which isn't a translation gap and
 * shouldn't be announced as one. Distinguishing the two matters because
 * `getField` itself silently falls back to English, which is the wrong
 * behaviour for a piece of content substantial enough that hiding the gap
 * would mislead a reader (see TranslationNotice).
 */
export function excerptUntranslated(article: Article, lang: ArticleLang): boolean {
  const other: ArticleLang = lang === "ar" ? "en" : "ar";
  return !article.excerpt[lang] && !!article.excerpt[other];
}
