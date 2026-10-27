import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { PageHero, PageLayout } from "@/components/PageLayout";
import { RichText } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PayloadPage } from "@/lib/payload";

/** One of the entries in lib/queries, fetched on the server by the route's loader. */
type Query<T> = UseQueryOptions<T, Error, T, string[]>;

/**
 * The Disclaimer and Privacy Policy pages, both linked from the footer and
 * both edited in the CMS under Site. There is no built-in copy to fall back
 * on, unlike the About page: the text was entered in the CMS from the start,
 * and keeping a second copy of a legal text in the code would only let the
 * two drift apart.
 */
export function LegalPage({
  query,
  fallbackTitle,
}: {
  query: Query<PayloadPage | null>;
  fallbackTitle: string;
}) {
  const { isArabic } = useLanguage();

  const { data: page } = useQuery(query);

  const title = (isArabic ? page?.titleAr : page?.title) || fallbackTitle;
  const body = isArabic ? page?.bodyAr : page?.body;

  return (
    <PageLayout>
      <PageHero title={title} />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <RichText value={body} className="space-y-5 text-sm leading-relaxed text-foreground" />
      </section>
    </PageLayout>
  );
}
