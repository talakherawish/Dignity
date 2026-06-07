import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageLayout, ImagePlaceholder } from "@/components/PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { ARTICLES, getField, type Article, type ArticleLang } from "@/data/articles";
import {
  fetchArticles,
  fetchMediaUpdatesByType,
  formatDate,
  mediaUrl,
  extractText,
  type PayloadArticle,
  type PayloadMediaUpdate,
} from "@/lib/payload";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dignity — Academic Initiative" },
      { name: "description", content: "Dignity is an academic initiative dedicated to research, dialogue, and the advancement of human dignity." },
    ],
  }),
  component: Home,
});


// ── Map Payload article → local Article shape ─────────────────────────────
function mapPayloadArticle(pa: PayloadArticle): Article {
  return {
    id: pa.id,
    image: mediaUrl(pa.image) || "",
    date: { en: formatDate(pa.date, "en"), ar: formatDate(pa.date, "ar"), fr: formatDate(pa.date, "en") },
    title: { en: pa.title, ar: pa.titleAr ?? pa.title, fr: pa.title },
    excerpt: { en: pa.excerpt ?? "", ar: pa.excerptAr ?? pa.excerpt ?? "", fr: pa.excerpt ?? "" },
    body: {
      en: extractText(pa.content),
      ar: extractText(pa.contentAr).length ? extractText(pa.contentAr) : extractText(pa.content),
      fr: extractText(pa.content),
    },
  };
}

type PillarItem = { titleKey: TranslationKey; descKey: TranslationKey; to: string; color: string };
const PILLARS: PillarItem[] = [
  { titleKey: "pillar.research", descKey: "pillar.research.desc", to: "/projects/research", color: "var(--brand-cyan)" },
  { titleKey: "pillar.dialogue", descKey: "pillar.dialogue.desc", to: "/activities/seminars", color: "var(--brand-magenta)" },
  { titleKey: "pillar.partnership", descKey: "pillar.partnership.desc", to: "/about/partners", color: "oklch(0.18 0.01 270)" },
];

type TeamMember = {
  role1Key: TranslationKey;
  role2Key: TranslationKey;
};
const TEAM_MEMBERS: TeamMember[] = [
  { role1Key: "team.role1", role2Key: "team.role1b" },
  { role1Key: "team.role2", role2Key: "team.role2b" },
  { role1Key: "team.role3", role2Key: "team.role3b" },
];

// ── News carousel with 5-second autoplay and fade transition ──────────────
function NewsCarousel() {
  const { t, lang, isArabic } = useLanguage();
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  const { data: payloadArticles = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: fetchArticles,
    staleTime: 5 * 60 * 1000,
  });
  const articles = payloadArticles.length > 0 ? payloadArticles.map(mapPayloadArticle) : ARTICLES;

  const goTo = useCallback((next: number) => {
    setVisible(false);
    setTimeout(() => {
      setI(next);
      setVisible(true);
    }, 240);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => goTo((i + 1) % articles.length), 5000);
    return () => clearInterval(id);
  }, [i, paused, goTo]);

  const article = articles[Math.min(i, articles.length - 1)];
  const l = lang as ArticleLang;
  const fade = {
    opacity: visible ? 1 : 0,
    transition: "opacity 0.24s ease",
  } as const;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="border border-border rounded-sm overflow-hidden bg-background"
    >
      <div className="grid md:grid-cols-[2fr_3fr]">
        {/* Article image — fades with slide */}
        <div style={{ ...fade, aspectRatio: "4/3", overflow: "hidden" }}>
          <img
            src={article.image}
            alt={getField(article, "title", l)}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text panel */}
        <div
          className="p-7 lg:p-9 flex flex-col justify-between"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(5px)",
            transition: "opacity 0.24s ease, transform 0.24s ease",
          }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-3">
              {getField(article, "date", l)}
            </div>
            <h3 className={`font-serif text-xl lg:text-2xl text-primary mb-3 leading-snug ${isArabic ? "text-right" : ""}`}>
              {getField(article, "title", l)}
            </h3>
            <p className={`text-sm text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
              {getField(article, "excerpt", l)}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            {/* Controls + dots */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button
                  onClick={() => goTo(isArabic ? (i + 1) % articles.length : (i - 1 + articles.length) % articles.length)}
                  aria-label={t("news.prev")}
                  className="carousel-prev h-8 w-8 rounded-full border border-border flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => goTo(isArabic ? (i - 1 + articles.length) % articles.length : (i + 1) % articles.length)}
                  aria-label={t("news.next")}
                  className="carousel-next h-8 w-8 rounded-full border border-border flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Minimal slide dots */}
              <div className="flex items-center gap-1" role="tablist">
                {articles.map((_, idx) => (
                  <button
                    key={idx}
                    role="tab"
                    aria-selected={idx === i}
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => goTo(idx)}
                    className={[
                      "h-1 rounded-full transition-all duration-300",
                      idx === i ? "w-5 bg-accent" : "w-1.5 bg-border hover:bg-muted-foreground/50",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>

            <Link
              to="/media/news"
              className="text-xs font-medium text-accent hover:underline tracking-wide"
            >
              {t("news.viewAll")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


type Announcement = { date: string; title: string; titleAr: string; type: string; typeAr: string; to: string };
const ANNOUNCEMENTS: Announcement[] = [
  { date: "JUN 15, 2026", title: "Call for applications: Research Fellows 2026–2027", titleAr: "دعوة للتقديم: زملاء بحث 2026–2027", type: "Fellowship", typeAr: "زمالة", to: "/media/announcements" },
  { date: "JUL 3, 2026", title: "Upcoming Conference on Research Ethics — registration open", titleAr: "مؤتمر قادم حول أخلاقيات البحث — التسجيل مفتوح", type: "Conference", typeAr: "مؤتمر", to: "/media/announcements" },
  { date: "AUG 10, 2026", title: "Seminar: Artificial Intelligence and Human Dignity", titleAr: "ندوة: الذكاء الاصطناعي والكرامة الإنسانية", type: "Seminar", typeAr: "ندوة", to: "/media/announcements" },
];

function AnnouncementsSection() {
  const { t, lang, isArabic } = useLanguage();

  const { data: payloadAnnouncements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => fetchMediaUpdatesByType("announcement"),
    staleTime: 5 * 60 * 1000,
  });

  const items =
    payloadAnnouncements.length > 0
      ? payloadAnnouncements.map((a: PayloadMediaUpdate) => ({
          date: formatDate(a.date, lang === "ar" ? "ar" : "en"),
          title: a.title,
          titleAr: a.titleAr ?? a.title,
          type: "Announcement",
          typeAr: "إعلان",
          to: "/media/announcements",
        }))
      : ANNOUNCEMENTS;

  return (
    <section className="border-b border-border bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1 rounded-full" style={{ background: "var(--brand-magenta)" }} />
            <h2 className="font-serif text-2xl text-primary">
              {isArabic ? "الإعلانات" : "Announcements"}
            </h2>
          </div>
          <Link to="/media/announcements" className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors tracking-wide">
            {t("news.viewAll")}
          </Link>
        </div>

        <div className="announcements-grid grid gap-4 sm:grid-cols-3" dir={isArabic ? "rtl" : "ltr"}>
          {items.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className="group block bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <div className="h-1 w-full" style={{ background: "var(--brand-magenta)" }} />
              <div className={`p-6 ${isArabic ? "text-right" : ""}`}>
                <div className={`font-semibold mb-2 text-muted-foreground ${isArabic ? "text-sm" : "text-[9px] uppercase tracking-widest"}`}>
                  {lang === "ar" ? item.typeAr : item.type}
                </div>
                <p className={`font-medium text-primary leading-snug group-hover:text-accent transition-colors mb-4 ${isArabic ? "text-base" : "text-sm"}`}>
                  {lang === "ar" ? item.titleAr : item.title}
                </p>
                <div className={`font-medium tracking-wide ${isArabic ? "text-sm" : "text-[10px]"}`} style={{ color: "var(--brand-magenta)" }}>
                  {item.date}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Compact editorial team row (matches screenshot layout) ───────────────
function TeamSection() {
  const { t, isArabic } = useLanguage();
  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-center">

          {/* Left: eyebrow + title + button */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-2">
              {t("team.eyebrow")}
            </div>
            <h2 className="font-serif text-2xl lg:text-[1.75rem] text-primary leading-tight mb-5">
              {t("team.title")}
            </h2>
            <Link
              to="/about/participants"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground border border-border px-3.5 py-2 rounded-sm hover:bg-secondary transition-colors"
            >
              {t("team.btn")} <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Right: 3 compact cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TEAM_MEMBERS.map((m, idx) => (
              <Link
                key={idx}
                to="/about/participants"
                className="group flex items-start gap-3.5 p-4 border border-border rounded-sm bg-card hover:border-accent/30 hover:shadow-sm transition-all duration-200"
              >
                {/* Circular portrait placeholder */}
                <div className="shrink-0 h-[52px] w-[52px] rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6 text-muted-foreground/40"
                    aria-hidden
                  >
                    <circle cx="12" cy="8" r="4" fill="currentColor" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
                  </svg>
                </div>

                {/* Text */}
                <div className="min-w-0 pt-0.5">
                  <div className="font-semibold text-sm text-primary leading-tight">
                    {t("team.name")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {t(m.role1Key)}
                    <br />
                    {t(m.role2Key)}
                  </div>
                  <div className="mt-2 text-xs font-medium text-[color:var(--brand-magenta)] group-hover:underline">
                    {t("team.viewProfile")} {isArabic ? "←" : "→"}
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}


// ── Home page ─────────────────────────────────────────────────────────────
function Home() {
  const { t } = useLanguage();
  return (
    <PageLayout>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="border-b border-border relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "var(--brand-cyan)" }} />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: "var(--brand-magenta)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-4">
              {t("hero.eyebrow")}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.25rem] text-primary tracking-tight leading-[1.07]">
              {t("hero.title")}
            </h1>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-lg">
              {t("hero.desc")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/about" className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors">
                {t("hero.btn.about")}
              </Link>
              <Link to="/projects/research" className="inline-flex items-center px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-sm hover:bg-secondary transition-colors">
                {t("hero.btn.research")}
              </Link>
            </div>
          </div>
          <ImagePlaceholder label="Hero image placeholder" ratio="3/2" />
        </div>
      </section>

      {/* ── Pillars ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-border">
        <div className="grid gap-8 md:grid-cols-3">
          {PILLARS.map((p) => (
            <Link key={p.titleKey} to={p.to} className="group block">
              <div className="border-t-2 pt-5" style={{ borderColor: p.color }}>
                <h3 className="font-serif text-xl text-primary mb-2 group-hover:text-accent transition-colors">
                  {t(p.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(p.descKey)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Announcements (above News) ──────────────────────────────────── */}
      <AnnouncementsSection />

      {/* ── News ───────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full" style={{ background: "var(--brand-cyan)" }} />
              <h2 className="font-serif text-2xl text-primary">{t("media.news")}</h2>
            </div>
            <Link to="/media/news" className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors tracking-wide">
              {t("news.viewAll")}
            </Link>
          </div>
          <NewsCarousel />
        </div>
      </section>

      {/* ── Meet the Team ──────────────────────────────────────────────── */}
      <TeamSection />
    </PageLayout>
  );
}
