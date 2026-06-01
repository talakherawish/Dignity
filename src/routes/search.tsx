import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";

type SearchParams = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: SearchPage,
});

// ── Searchable content pool — will be replaced by Payload CMS API calls ──
type Result = { type: string; title: string; titleAr: string; excerpt: string; excerptAr: string; to: string };

const ALL_CONTENT: Result[] = [
  { type: "News", title: "Dignity Initiative receives new research grant", titleAr: "مبادرة الكرامة تحصل على منحة بحثية جديدة", excerpt: "The initiative has secured funding for a three-year research programme.", excerptAr: "حصلت المبادرة على تمويل لبرنامج بحثي لمدة ثلاث سنوات.", to: "/media/news" },
  { type: "Announcement", title: "Call for applications: Research Fellows 2026–2027", titleAr: "دعوة للتقديم: زملاء بحث 2026–2027", excerpt: "Applications are open for the next cohort of research fellows.", excerptAr: "يفتح باب التقديم لمجموعة الزملاء البحثيين القادمة.", to: "/media/announcements" },
  { type: "Activity", title: "Seminar: Decolonising Knowledge Production", titleAr: "ندوة: نزع الاستعمار من إنتاج المعرفة", excerpt: "An interdisciplinary seminar exploring colonial legacies in academic research.", excerptAr: "ندوة متعددة التخصصات تستكشف الإرث الاستعماري في البحث الأكاديمي.", to: "/activities/seminars" },
  { type: "Activity", title: "Windsor-Birzeit Annual Meeting", titleAr: "الاجتماع السنوي لمبادرة وندسور-بيرزيت", excerpt: "Annual gathering of the Windsor-Birzeit Dignity Initiative partners.", excerptAr: "التجمع السنوي لشركاء مبادرة وندسور-بيرزيت للكرامة.", to: "/activities/windsor-birzeit" },
  { type: "Fellow", title: "Dr. Raef Zreik", titleAr: "د. رائف زريق", excerpt: "Senior Researcher — Dignity Initiative", excerptAr: "باحث أول — مبادرة الكرامة", to: "/about/participants" },
  { type: "Fellow", title: "Dr. Sarah Al-Amin", titleAr: "د. سارة الأمين", excerpt: "Associate Professor — Faculty", excerptAr: "أستاذة مشاركة — عضو هيئة التدريس", to: "/about/participants" },
];

function SearchPage() {
  const { q } = Route.useSearch();
  const { lang, isArabic } = useLanguage();
  const query = q?.trim() ?? "";

  const results = query
    ? ALL_CONTENT.filter((item) => {
        const searchIn = [item.title, item.titleAr, item.excerpt, item.excerptAr, item.type]
          .join(" ")
          .toLowerCase();
        return searchIn.includes(query.toLowerCase());
      })
    : [];

  return (
    <PageLayout>
      <PageHero
        title={isArabic ? `نتائج البحث عن "${query}"` : `Search results for "${query}"`}
        description={
          results.length > 0
            ? isArabic
              ? `${results.length} نتيجة`
              : `${results.length} result${results.length === 1 ? "" : "s"}`
            : isArabic
            ? "لا توجد نتائج"
            : "No results found"
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {results.length > 0 ? (
          <div className="grid gap-4">
            {results.map((result, i) => (
              <Link
                key={i}
                to={result.to}
                className={`group block p-5 border border-border rounded-md bg-card hover:border-accent/40 hover:shadow-sm transition-all duration-150 ${isArabic ? "text-right" : ""}`}
              >
                <div className="text-[10px] uppercase tracking-wider font-semibold text-accent mb-1.5">
                  {result.type}
                </div>
                <div className="font-serif text-lg text-primary group-hover:text-accent transition-colors">
                  {lang === "ar" ? result.titleAr : result.title}
                </div>
                <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {lang === "ar" ? result.excerptAr : result.excerpt}
                </div>
              </Link>
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-20 text-muted-foreground">
            {isArabic
              ? `لم يتم العثور على نتائج لـ "${query}". حاول كلمات مختلفة.`
              : `No results for "${query}". Try different keywords.`}
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
