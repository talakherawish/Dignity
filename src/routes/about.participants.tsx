import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export const Route = createFileRoute("/about/participants")({
  component: FellowsPage,
});

// ── Placeholder data — will be replaced by Payload CMS data ──────────────
type Fellow = {
  name: string;
  title: string;
  category: "faculty" | "researcher" | "intern" | "student" | "visitor";
  photo?: string;
};

const FELLOWS: Fellow[] = [
  { name: "Dr. Sarah Al-Amin", title: "Associate Professor", category: "faculty" },
  { name: "Dr. Raef Zreik", title: "Senior Researcher", category: "researcher" },
  { name: "Lina Mansour", title: "Research Fellow", category: "researcher" },
  { name: "Omar Khalil", title: "PhD Researcher", category: "researcher" },
  { name: "Nour Haddad", title: "Research Intern", category: "intern" },
  { name: "Ahmad Suleiman", title: "Graduate Student", category: "student" },
  { name: "Maya Barakat", title: "Visiting Scholar", category: "visitor" },
  { name: "Dr. James Perry", title: "Visiting Professor", category: "visitor" },
  { name: "Rania Yousef", title: "Undergraduate Intern", category: "intern" },
];

const CATEGORIES = [
  { value: "all", en: "All", ar: "الكل" },
  { value: "faculty", en: "Faculty", ar: "أعضاء هيئة التدريس" },
  { value: "researcher", en: "Researchers", ar: "الباحثون" },
  { value: "intern", en: "Interns", ar: "المتدربون" },
  { value: "student", en: "Students", ar: "الطلاب" },
  { value: "visitor", en: "Visitors", ar: "الزوار" },
];

function FellowCard({ fellow }: { fellow: Fellow }) {
  return (
    <div className="border border-border rounded-md overflow-hidden bg-card hover:border-accent/40 hover:shadow-sm transition-all duration-200">
      {/* Photo */}
      <div className="aspect-square bg-secondary flex items-center justify-center overflow-hidden">
        {fellow.photo ? (
          <img src={fellow.photo} alt={fellow.name} className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-muted-foreground/30" aria-hidden>
            <circle cx="12" cy="8" r="4.5" fill="currentColor" />
            <path d="M3 20c0-4.4 4-8 9-8s9 3.6 9 8" fill="currentColor" />
          </svg>
        )}
      </div>
      {/* Info */}
      <div className="p-5">
        <div className="font-serif text-lg text-primary leading-tight">{fellow.name}</div>
        <div className="text-sm text-accent mt-1">{fellow.title}</div>
      </div>
    </div>
  );
}

function FellowsPage() {
  const { lang, isArabic } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = FELLOWS.filter((f) => {
    const matchesCategory = activeCategory === "all" || f.category === activeCategory;
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={isArabic ? "حول المبادرة" : "About"}
        title={isArabic ? "الزملاء" : "Fellows"}
        description={isArabic
          ? "الباحثون وأعضاء هيئة التدريس والمنتسبون الذين يشكّلون مجتمع مبادرة الكرامة."
          : "The researchers, faculty, and affiliates who form the Dignity initiative community."}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Filters + Search ─────────────────────────────────────── */}
        <div className={`flex flex-col sm:flex-row gap-4 mb-10 ${isArabic ? "sm:flex-row-reverse" : ""}`}>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={[
                  "px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
                  activeCategory === cat.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-accent hover:text-accent bg-background",
                ].join(" ")}
              >
                {lang === "ar" ? cat.ar : cat.en}
              </button>
            ))}
          </div>

          {/* Name search */}
          <div className={`relative sm:ml-auto ${isArabic ? "sm:ml-0 sm:mr-auto" : ""}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isArabic ? "ابحث باسم الزميل..." : "Search by name..."}
              className="pl-9 pr-4 py-2 text-sm border border-border rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent w-full sm:w-56 transition-colors"
            />
          </div>
        </div>

        {/* ── Fellows grid ─────────────────────────────────────────── */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((fellow, i) => (
              <FellowCard key={i} fellow={fellow} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground text-sm">
            {isArabic ? "لا توجد نتائج." : "No fellows found."}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
