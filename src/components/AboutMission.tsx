import {
  BookOpen,
  ShieldCheck,
  Globe2,
  Users,
  Lightbulb,
  CalendarDays,
  Share2,
  Sprout,
  Compass,
  Scale,
  Gavel,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { PageLayout } from "./PageLayout";
import { Reveal } from "./Reveal";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Fallback content (shown while Payload loads, or if a field is empty) ───
// Mirrors the real copy stored in the Payload "about" page doc, so there's
// no visible flash/placeholder mismatch once the fetch resolves.

const FALLBACK_PARAGRAPHS_EN = [
  "The Dignity Initiative (Karama) is a research initiative at Birzeit University. Its mission is to advance knowledge production that safeguards and fosters human dignity. The initiative is grounded in the understanding that dignity — an interdisciplinary concept — serves as a meaningful point of intersection between diverse academic fields, and a foundational pillar for scientific research ethics.",
  "Dignity is inseparable from free will, the capacity to exercise it, equality, and justice. Karama views these principles as central to the process of knowledge production, especially in situations that were deformed by various types and forms of hegemony, in particular colonial hegemony. The need to study dignity and related principles is a priority in Palestine, which continues to experience colonial domination.",
  "Karama functions as a platform for interdisciplinary research, working to expand this approach and foster this tradition within an academic environment that was traditionally designed in accordance with assumed disciplinary boundaries. Its methodological orientation reflects a clear commitment to transforming reality and advancing emancipation — an approach grounded in praxis.",
  "Karama realizes its goals through several avenues:",
];

const FALLBACK_PARAGRAPHS_AR = [
  "مبادرة كرامة مبادرة بحثية في جامعة بيرزيت، تهدف إلى تعزيز إنتاج المعرفة الذي يصون ويعزز الكرامة الإنسانية. وترتكز المبادرة إلى فهمٍ يرى في مفهوم الكرامة، بوصفه مفهوماً متداخل الحقول، نقطة التقاء جوهرية بين الحقول الأكاديمية المتنوّعة، ومرتكزاً لمبادئ أخلاق البحث العلمي.",
  "لا تنفصل الكرامة عن الإرادة الحرة، والقدرة على ممارستها. كما لا تنفصل عن المساواة، والعدالة. وتعتبر مبادرة الكرامة هذه المبادئ عناصر مركزية في عملية إنتاج المعرفة، وخصوصاً في الأماكن التي شوّهتها أنواع وأشكال الهيمنة، لا سيما الاستعمارية. ولذلك، فإن الحاجة إلى دراسة الكرامة والمبادئ المرتبطة بها في فلسطين، التي لا تزال تعيش واقعاً استعمارياً مستمراً، ملحّة.",
  "تعمل مبادرة كرامة بوصفها منصّة للبحث متداخل الحقول، وتسعى إلى توسيع هذا التوجّه وتعزيز حضوره داخل بيئة أكاديمية تقوم تقليدياً على افتراض الانفصال بين الحقول المعرفية. ويعبّر التوجّه المنهجي للمبادرة عن التزام بتغيير الواقع وتعزيز مسارات التحرر، وهو التزام يستند إلى الممارسة المنظّرة (praxis) – التأثير على الواقع باستخدام الفعل الواعي.",
  "تسعى مبادرة كرامة إلى تحقيق هدفها عبر عدة مسارات:",
];

const FALLBACK_ITEMS_EN = [
  "Conducting research studies on the concept of dignity and related themes.",
  "Developing and promoting a research ethics approach that ensures research's contribution to safeguarding human dignity.",
  "Building meaningful partnerships with scholars interested in Karama's goals worldwide, and encouraging academic dialogue and exchange.",
  "Engaging students as active partners, not passive recipients, in university life, and expanding student exchange.",
  "Creating additional spaces for free critical thinking and intellectual engagement beyond formal courses and classrooms.",
  "Organising seminars, conferences, research forums, dialogues, and other academic activities.",
  "Disseminating relevant intellectual output in various forms.",
  "Supporting student- and community-driven initiatives that align with its mission.",
];

const FALLBACK_ITEMS_AR = [
  "إجراء دراسات علمية حول مفهوم الكرامة والموضوعات ذات الصلة.",
  "تطوير وتعزيز منظومة أخلاق البحث العلمي تضمن مساهمة الأبحاث في صون الكرامة الإنسانية.",
  "بناء شراكات فاعلة مع باحثين مهتمين بأهداف المبادرة حول العالم، وتشجيع الحوار والتبادل الأكاديمي.",
  "إشراك الطلبة بوصفهم شركاء فاعلين في الحياة الجامعية، لا مجرد متلقين، وتوسيع التبادل الطلابي.",
  "خلق مساحات إضافية للتفكير النقدي الحر، وللنشاط الفكري خارج القاعات والمساقات الرسمية.",
  "تنظيم الندوات، والمؤتمرات، والملتقيات البحثية، والحوارات، وغيرها من الفعاليات الأكاديمية.",
  "نشر وتعميم الإنتاج الفكري ذات العلاقة بمختلف الأشكال.",
  "دعم المبادرات الطلابية والمجتمعية التي تنسجم مع رسالة المبادرة.",
];

const AVENUE_ICONS: LucideIcon[] = [
  BookOpen,
  ShieldCheck,
  Globe2,
  Users,
  Lightbulb,
  CalendarDays,
  Share2,
  Sprout,
];

const PRINCIPLES: { en: string; ar: string; Icon: LucideIcon }[] = [
  { en: "Free Will", ar: "الإرادة الحرة", Icon: Compass },
  { en: "Equality", ar: "المساواة", Icon: Scale },
  { en: "Justice", ar: "العدالة", Icon: Gavel },
  { en: "Praxis", ar: "الممارسة", Icon: Flame },
];

export function AboutMissionPage({
  eyebrow,
  title,
  description,
  paragraphs,
  items,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  paragraphs?: string[];
  items?: string[];
}) {
  const { isArabic } = useLanguage();

  const fallbackParagraphs = isArabic ? FALLBACK_PARAGRAPHS_AR : FALLBACK_PARAGRAPHS_EN;
  const fallbackItems = isArabic ? FALLBACK_ITEMS_AR : FALLBACK_ITEMS_EN;

  const resolvedItems = items && items.length > 0 ? items : fallbackItems;
  const resolvedParagraphs = paragraphs && paragraphs.length > 0 ? paragraphs : fallbackParagraphs;

  // The last paragraph, when present alongside items, is treated as the
  // lead-in line introducing the avenues grid (e.g. "Karama realizes its
  // goals through several avenues:") rather than flowing intro prose.
  const hasLeadIn = resolvedParagraphs.length > 1 && resolvedItems.length > 0;
  const introParagraphs = hasLeadIn ? resolvedParagraphs.slice(0, -1) : resolvedParagraphs;
  const leadIn = hasLeadIn ? resolvedParagraphs[resolvedParagraphs.length - 1] : undefined;

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-cyan)" }}
        />
        <div
          className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-magenta)" }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-center">
          <Reveal>
            {eyebrow && (
              <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-3">
                {eyebrow}
              </div>
            )}
            <h1 className="font-serif text-3xl md:text-4xl text-primary tracking-tight">{title}</h1>
            {description && (
              <p className="mt-3 max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {description}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      {/* Intro prose */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className={`space-y-5 text-[15px] leading-[1.85] text-foreground/85 ${isArabic ? "text-right" : ""}`}>
          {introParagraphs.map((p, i) => (
            <Reveal key={i} delay={i * 90}>
              <p
                className={
                  i === 0
                    ? "first-letter:font-serif first-letter:text-4xl first-letter:text-primary first-letter:leading-none first-letter:me-1"
                    : ""
                }
              >
                {p}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Principles strip */}
        <Reveal delay={introParagraphs.length * 90 + 80}>
          <div
            className={`mt-10 flex flex-wrap gap-3 ${isArabic ? "justify-end" : "justify-start"}`}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {PRINCIPLES.map(({ en, ar, Icon }) => (
              <span
                key={en}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-1.5 text-xs font-medium text-foreground/75"
              >
                <Icon className="h-3.5 w-3.5" style={{ color: "var(--brand-magenta)" }} />
                {isArabic ? ar : en}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Avenues grid */}
      {resolvedItems.length > 0 && (
        <section className="border-t border-border bg-secondary/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {leadIn && (
              <Reveal className="mb-10">
                <div className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse text-right" : ""}`}>
                  <div className="h-5 w-1 rounded-full shrink-0" style={{ background: "var(--brand-cyan)" }} />
                  <h2 className="font-serif text-xl md:text-2xl text-primary leading-snug">{leadIn}</h2>
                </div>
              </Reveal>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" dir={isArabic ? "rtl" : "ltr"}>
              {resolvedItems.map((item, i) => {
                const Icon = AVENUE_ICONS[i % AVENUE_ICONS.length];
                return (
                  <Reveal key={i} delay={i * 70}>
                    <div className="group h-full rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/70 group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-serif text-xs text-muted-foreground/50">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed text-foreground/80 ${isArabic ? "text-right" : ""}`}>
                        {item}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
}
