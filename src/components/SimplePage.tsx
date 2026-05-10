import { PageLayout, PageHero, ImagePlaceholder } from "./PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export function SimplePage({
  eyebrow,
  title,
  description,
  body,
  withImage = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  body?: string[];
  withImage?: boolean;
}) {
  const { t } = useLanguage();
  const paragraphs = body ?? [t("page.placeholder"), t("page.placeholder2")];
  return (
    <PageLayout>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5 text-foreground/85 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {withImage && (
          <aside>
            <ImagePlaceholder label="Image placeholder" ratio="4/5" />
          </aside>
        )}
      </section>
    </PageLayout>
  );
}
