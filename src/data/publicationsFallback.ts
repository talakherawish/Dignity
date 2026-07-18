/**
 * Hardcoded fallback content for Publications pages, used when the Payload
 * collection for that type is empty (e.g. backend temporarily unreachable).
 * Mirrors the pattern in src/data/articles.ts / about.participants.tsx —
 * see project memory "project-payload-hardcoded-fallback".
 *
 * fileUrl points at a static asset under /public, served directly by Vercel,
 * so these work with no Payload backend at all.
 */

export type PublicationFallbackItem = {
  id: string;
  title: string;
  titleAr: string;
  author?: string;
  authorAr?: string;
  date: string; // ISO date
  description?: string;
  descriptionAr?: string;
  fileUrl: string;
};

/**
 * "ملصقات" (posters) from the Protecting Workers' Dignity project — union
 * awareness / labor-rights posters, originally published Dec 2021 in
 * partnership with the Rosa Luxemburg Foundation.
 * Source: https://dignity.birzeit.edu/ar/projects/protecting-workers-dignity
 */
export const POSTERS_FALLBACK: PublicationFallbackItem[] = [
  {
    id: "poster-duration-of-employment-contract",
    title: "Duration of the Employment Contract",
    titleAr: "مدة عقد العمل",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/duration-of-employment-contract.pdf",
  },
  {
    id: "poster-domestic-work",
    title: "Domestic Work",
    titleAr: "عمل المنازل",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/domestic-work.pdf",
  },
  {
    id: "poster-special-employment-contract",
    title: "Special Employment Contract",
    titleAr: "عقد عمل خاص",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/special-employment-contract.pdf",
  },
  {
    id: "poster-persons-with-disabilities",
    title: "Persons with Disabilities",
    titleAr: "ذوي الإعاقة",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/persons-with-disabilities.pdf",
  },
  {
    id: "poster-kindergarten-workers",
    title: "Kindergarten Workers",
    titleAr: "العاملات في رياض الأطفال",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/kindergarten-workers.pdf",
  },
  {
    id: "poster-social-security",
    title: "Social Security",
    titleAr: "الضمان الاجتماعي",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/social-security.pdf",
  },
  {
    id: "poster-annual-increases",
    title: "Annual Increases",
    titleAr: "الزيادات السنوية",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/annual-increases.pdf",
  },
  {
    id: "poster-minimum-wage",
    title: "Minimum Wage",
    titleAr: "الحد الأدنى للأجور",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/minimum-wage.pdf",
  },
  {
    id: "poster-right-to-strike",
    title: "The Right to Strike",
    titleAr: "الإضراب",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/right-to-strike.pdf",
  },
  {
    id: "poster-safety-procedures",
    title: "Safety Procedures",
    titleAr: "إجراءات السلامة",
    author: "Dignity Initiative",
    authorAr: "مبادرة كرامة",
    date: "2021-12-01",
    fileUrl: "/publications/posters/safety-procedures.pdf",
  },
];

/**
 * Decolonising Knowledge Production research (Aug 2024) — a Dignity
 * Initiative study conducted with IDRC Canada support, alongside AUB,
 * the Centre for Lebanese Studies, University of Dar Al-Salaam, and
 * University of Addis Ababa.
 */
export const REPORTS_FALLBACK: PublicationFallbackItem[] = [
  {
    id: "report-decolonising-knowledge-production",
    title: "Decolonising Knowledge Production — Research Report",
    titleAr: "تقرير عن نزع البنى الكولونيالية عن عملية إنتاج المعرفة",
    author: "Dignity Initiative Research Team, Birzeit University",
    authorAr: "فريق مبادرة كرامة في جامعة بيرزيت",
    date: "2024-08-01",
    fileUrl: "/publications/reports/decolonising-knowledge-production-report.pdf",
  },
  {
    id: "report-decolonising-knowledge-production-executive-summary",
    title: "Decolonising Knowledge Production — Executive Summary",
    titleAr: "نزع البنى الكولونيالية عن عملية إنتاج المعرفة — الملخص التنفيذي",
    author: "Dignity Initiative Research Team, Birzeit University",
    authorAr: "فريق مبادرة كرامة في جامعة بيرزيت",
    date: "2024-08-01",
    description:
      "This report presents the findings of the Dignity Initiative research team on the components that entrench colonial structures — and those that enable decolonization and emancipation — in knowledge production at Arab universities.",
    fileUrl: "/publications/reports/decolonising-knowledge-production-executive-summary.pdf",
  },
];
