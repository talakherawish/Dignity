import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, PageHero, ImagePlaceholder } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/projects/research")({
  head: () => ({ meta: [{ title: "Research Projects — Dignity" }] }),
  component: ResearchProjects,
});

function ResearchProjects() {
  const { t } = useLanguage();
  return (
    <PageLayout>
      <PageHero
        eyebrow={t("projects")}
        title={t("projects.research")}
        description={t("projects.page.desc")}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid gap-10 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i} className="border border-border rounded-md overflow-hidden bg-card">
            <ImagePlaceholder label={`Project ${i + 1}`} ratio="16/9" />
            <div className="p-6">
              <div className="text-xs uppercase tracking-wider text-accent mb-2">
                {t("projects.area")}
              </div>
              <h2 className="font-serif text-2xl text-primary mb-3">
                {t("projects.placeholder.title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("projects.placeholder.desc")}
              </p>
            </div>
          </article>
        ))}
      </section>
    </PageLayout>
  );
}
