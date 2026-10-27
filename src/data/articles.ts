import type { Language } from "@/contexts/LanguageContext";
import {
  extractText,
  formatDate,
  formatted,
  mediaSrcSet,
  mediaUrl,
  type Formatted,
  type PayloadNews,
} from "@/lib/payload";

/** The languages an article carries. Mirrors the site's active language set. */
export type ArticleLang = Language;

export type Article = {
  id: string;
  image: string;
  /** Smaller copies of `image` for an <img srcset> -- see mediaSrcSet. */
  imageSrcSet?: string;
  date: Record<ArticleLang, string>;
  title: Record<ArticleLang, string>;
  excerpt: Record<ArticleLang, string>;
  /** The same two with the editor's bold and italic -- see getFormatted. */
  formatted: Record<"title" | "excerpt", Record<ArticleLang, Formatted>>;
  body: Record<ArticleLang, string[]>;
};

/** Adapt a Payload news entry to the local Article shape the homepage carousel and the news listing render. */
export function mapPayloadNews(pa: PayloadNews): Article {
  const image = mediaUrl(pa.image) || "";
  return {
    id: pa.id,
    image,
    imageSrcSet: mediaSrcSet(pa.image),
    date: { en: formatDate(pa.date, "en"), ar: formatDate(pa.date, "ar") },
    title: { en: pa.title, ar: pa.titleAr ?? pa.title },
    excerpt: { en: pa.excerpt ?? "", ar: pa.excerptAr ?? pa.excerpt ?? "" },
    formatted: {
      title: { en: formatted(pa, "title", false), ar: formatted(pa, "title", true) },
      excerpt: { en: formatted(pa, "excerpt", false), ar: formatted(pa, "excerpt", true) },
    },
    // Each language carries its own body, with no cross-language fallback:
    // an article written up in one language only is announced as untranslated
    // by the card rather than being served in the other language.
    body: {
      en: extractText(pa.content),
      ar: extractText(pa.contentAr),
    },
  };
}

/** A title or summary in the reader's language, with its bold and italic (see FormattedText). */
export function getFormatted(
  article: Article,
  field: "title" | "excerpt",
  lang: ArticleLang,
): Formatted {
  return article.formatted[field][lang];
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
