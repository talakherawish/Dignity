import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/about/participants")({
  component: ParticipantsLayout,
});

const TABS: { labelKey: TranslationKey; to: string }[] = [
  { labelKey: "about.faculty", to: "/about/participants/faculty" },
  { labelKey: "about.researchers", to: "/about/participants/researchers" },
  { labelKey: "about.interns", to: "/about/participants/interns" },
  { labelKey: "about.students", to: "/about/participants/students" },
  { labelKey: "about.visitors", to: "/about/participants/visitors" },
];

function ParticipantsLayout() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isIndex = pathname === "/about/participants" || pathname === "/about/participants/";

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("about")}
        title={t("about.participants")}
        description={t("participants.page.desc")}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex flex-wrap gap-2 border-b border-border">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-accent border-b-2 border-transparent data-[status=active]:border-accent data-[status=active]:text-accent -mb-px"
            >
              {t(tab.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
      {isIndex ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-muted-foreground">
          {t("participants.select")}
        </div>
      ) : (
        <Outlet />
      )}
    </PageLayout>
  );
}
