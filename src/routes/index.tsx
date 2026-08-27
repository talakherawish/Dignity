import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Mail } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { ARTICLES, getField, mapPayloadNews } from "@/data/articles";
import { withItalicQuotes } from "@/lib/text";
import { fetchNews, fetchParticipants, mediaUrl, type PayloadParticipant } from "@/lib/payload";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dignity — Academic Initiative" },
      {
        name: "description",
        content:
          "Dignity is an academic initiative dedicated to research, dialogue, and the advancement of human dignity.",
      },
    ],
  }),
  component: Home,
});

type PillarItem = { titleKey: TranslationKey; descKey: TranslationKey; to: string; color: string };
const PILLARS: PillarItem[] = [
  {
    titleKey: "pillar.research",
    descKey: "pillar.research.desc",
    to: "/projects/research",
    color: "var(--brand-cyan)",
  },
  {
    titleKey: "pillar.dialogue",
    descKey: "pillar.dialogue.desc",
    to: "/activities/seminars",
    color: "var(--brand-magenta)",
  },
  {
    titleKey: "pillar.partnership",
    descKey: "pillar.partnership.desc",
    to: "/about/partners",
    color: "oklch(0.18 0.01 270)",
  },
];

type TeamPerson = {
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  email: string;
  bio: string;
  bioAr: string;
  photo?: string;
};

const TEAM_FALLBACK: TeamPerson[] = [
  {
    name: "Mudar Kassis",
    nameAr: "مضر قسيس",
    title: "Director",
    titleAr: "المدير",
    email: "m.kassis@birzeit.edu",
    bio: "",
    bioAr: "",
    photo: undefined,
  },
  {
    name: "Eman Al-Assa",
    nameAr: "إيمان العصا",
    title: "Faculty",
    titleAr: "هيئة التدريس",
    email: "e.alassa@birzeit.edu",
    bio: "",
    bioAr: "",
    photo: undefined,
  },
  {
    name: "Dr. Raef Zreik",
    nameAr: "د. رائف زريق",
    title: "Senior Researcher",
    titleAr: "باحث أول",
    email: "r.zreik@birzeit.edu",
    bio: "Dr. Zreik is a senior researcher whose work focuses on the philosophy of law, colonialism, and dignity.",
    bioAr: "باحث أول يتمحور عمله حول فلسفة القانون والاستعمار والكرامة.",
    photo: undefined,
  },
];

function mapPayloadToTeamPerson(p: PayloadParticipant): TeamPerson {
  return {
    name: p.name,
    nameAr: p.nameAr ?? p.name,
    title: p.title ?? "",
    titleAr: p.titleAr ?? p.title ?? "",
    email: p.email ?? "",
    bio: p.bio ?? "",
    bioAr: p.bioAr ?? p.bio ?? "",
    photo: mediaUrl(p.photo) || undefined,
  };
}

// ── Latest news and announcements: the newest 4, as a grid of cards ───────
/** Enough to fill a 2x2 grid without the feed sprawling. */
const FEATURED_COUNT = 4;

/** Fixed so every card's text starts at the same height regardless of image. */
const CARD_IMAGE = "h-28 w-28 sm:h-32 sm:w-32 object-cover rounded-sm border border-border";

function LatestNewsAndAnnouncements() {
  const { lang, isArabic } = useLanguage();

  const { data: payloadNews = [] } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000,
  });
  const articles = (payloadNews.length > 0 ? payloadNews.map(mapPayloadNews) : ARTICLES).slice(
    0,
    FEATURED_COUNT,
  );

  if (articles.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2" dir={isArabic ? "rtl" : "ltr"}>
      {articles.map((article) => (
        <Link
          key={article.id}
          to="/media/news"
          search={{ id: article.id }}
          aria-label={getField(article, "title", lang)}
          // items-start: the title/date column starts level with the top of
          // the image rather than centering against its full height.
          className="group flex items-start gap-4 rounded-sm border border-border bg-card p-4 transition-colors hover:border-accent/30 hover:shadow-sm"
        >
          {article.image ? (
            <img src={article.image} alt="" className={"shrink-0 " + CARD_IMAGE} />
          ) : (
            <div className={"shrink-0 bg-secondary " + CARD_IMAGE} />
          )}
          <div className="min-w-0">
            <p
              className={
                "font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-magenta)] " +
                (isArabic ? "text-[13px]" : "text-[11px]")
              }
            >
              {getField(article, "date", lang)}
            </p>
            <h3
              className={
                "mt-1.5 font-serif text-base leading-snug text-primary transition-colors group-hover:text-accent " +
                (isArabic ? "md:text-[19px]" : "md:text-[17px]")
              }
            >
              {withItalicQuotes(getField(article, "title", lang))}
            </h3>
            {getField(article, "excerpt", lang) && (
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {getField(article, "excerpt", lang)}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Team member modal ─────────────────────────────────────────────────────
function TeamModal({
  person,
  onClose,
  isArabic,
  lang,
}: {
  person: TeamPerson;
  onClose: () => void;
  isArabic: boolean;
  lang: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Sized to match ParticipantModal on /about/participants — the two are
          the same card and should stay in step. No photo means no avatar at
          all, rather than an empty placeholder circle, so both paddings
          collapse the same way ParticipantModal's do. */}
      <div className="relative w-full max-w-md" style={{ paddingTop: person.photo ? "112px" : "0px" }}>
        {/* Floating avatar */}
        {person.photo && (
          <div className="absolute left-1/2 top-0 -translate-x-1/2 z-10">
            <div className="h-56 w-56 rounded-full overflow-hidden shadow-2xl bg-secondary flex items-center justify-center">
              <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
            </div>
          </div>
        )}
        {/* Card */}
        <div
          className={
            "relative bg-card border border-border rounded-lg shadow-2xl overflow-y-auto max-h-[80vh]" +
            (isArabic ? " text-right" : "")
          }
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="px-8 pb-8" style={{ paddingTop: person.photo ? "116px" : "48px" }}>
            <h2 className="font-serif text-2xl text-primary text-center">
              {lang === "ar" ? person.nameAr : person.name}
            </h2>
            {(person.title || person.titleAr) && (
              <p className="text-muted-foreground text-sm text-center mt-1">
                {lang === "ar" ? person.titleAr : person.title}
              </p>
            )}
            {person.email && (
              <a
                href={"mailto:" + person.email}
                className="mt-4 flex items-center justify-center gap-2 bg-secondary border border-border text-foreground/70 text-sm px-4 py-2.5 rounded-full hover:text-foreground hover:border-foreground/30 transition-colors w-fit mx-auto"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {person.email}
              </a>
            )}
            {(person.bio || person.bioAr) && (
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                {lang === "ar" ? person.bioAr : person.bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compact editorial team row ────────────────────────────────────────────
function TeamSection() {
  const { t, lang, isArabic } = useLanguage();
  const [selected, setSelected] = useState<TeamPerson | null>(null);

  const { data: payloadParticipants = [] } = useQuery({
    queryKey: ["participants"],
    queryFn: fetchParticipants,
    staleTime: 5 * 60 * 1000,
  });

  const members: TeamPerson[] = (
    payloadParticipants.length > 0 ? payloadParticipants.map(mapPayloadToTeamPerson) : TEAM_FALLBACK
  ).slice(0, 3);

  return (
    <>
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-center">
            <div>
              <div
                className={
                  "uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-2 " +
                  (isArabic ? "text-[14px]" : "text-[12px]")
                }
              >
                {t("team.eyebrow")}
              </div>
              <h2
                className={
                  "font-serif text-2xl text-primary leading-tight mb-5 " +
                  (isArabic ? "lg:text-[2.125rem]" : "lg:text-[2rem]")
                }
              >
                {t("team.title")}
              </h2>
              <Link
                to="/about/participants"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground border border-border px-3.5 py-2 rounded-sm hover:bg-secondary transition-colors"
              >
                {t("team.btn")} <span aria-hidden>{isArabic ? "←" : "→"}</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {members.map((person, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelected(person)}
                  className="group flex items-start gap-3.5 p-4 border border-border rounded-sm bg-card hover:border-accent/30 hover:shadow-sm transition-all duration-200 text-left w-full"
                >
                  {/* The list never shows a photo, even when one exists — it
                      only appears in the modal once someone clicks through. */}
                  <div className={"min-w-0 pt-0.5" + (isArabic ? " text-right" : "")}>
                    <div className="font-semibold text-sm text-primary leading-tight group-hover:text-accent transition-colors">
                      {lang === "ar" ? person.nameAr : person.name}
                    </div>
                    {(person.title || person.titleAr) && (
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {lang === "ar" ? person.titleAr : person.title}
                      </div>
                    )}
                    <div className="text-[11px] font-medium text-green-600 mt-1 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {isArabic ? "اضغط لقراءة المزيد" : "Click to read more"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {selected && (
        <TeamModal
          person={selected}
          onClose={() => setSelected(null)}
          isArabic={isArabic}
          lang={lang}
        />
      )}
    </>
  );
}

// ── Home page ─────────────────────────────────────────────────────────────
function Home() {
  const { t, isArabic } = useLanguage();
  return (
    <PageLayout>
      {/* Shared backdrop for the whole page: soft cyan/magenta blobs staggered
          down the full scroll length, so the color motif carries past the
          hero instead of stopping at its edge. vh-based offsets rather than
          fixed pixels, since the sections below are variable height. */}
      <div className="relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-cyan)" }}
        />
        <div
          className="absolute top-[60vh] -left-24 h-64 w-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-magenta)" }}
        />
        <div
          className="absolute top-[130vh] -right-28 h-80 w-80 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-cyan)" }}
        />
        <div
          className="absolute top-[200vh] -left-28 h-72 w-72 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-magenta)" }}
        />

        {/* Hero — fills the rest of the first screen (100vh minus the sticky
            header, whose height changes at each breakpoint: 4px gradient bar +
            60/80/101px row) so this is the only thing visible on first load,
            whatever the copy length, and the content is centered in what's
            actually visible rather than in a box that runs past the fold. */}
        <section className="relative flex items-center min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-84px)] lg:min-h-[calc(100vh-105px)]">
          {/*
           * Temporary centered layout with the office photo dropped, while a
           * proper homepage design is worked out -- not the final treatment.
           */}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 flex flex-col items-center text-center">
            <div
              className={
                "uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-4 " +
                (isArabic ? "text-[14px]" : "text-[12px]")
              }
            >
              {t("hero.eyebrow")}
            </div>
            {/*
             * whitespace-pre-line so a line break typed into the Hero Title or
             * Hero Description in Site Settings is the line break shown here.
             * Both are textarea fields, so the newline was always stored -- it
             * was HTML that collapsed it into a space, which made pressing
             * Enter in the admin look like it did nothing.
             *
             * lg:whitespace-nowrap forces the title onto one line at desktop
             * widths -- font metrics for the Arabic serif fallback vary enough
             * across systems that a width-based fit can't be guaranteed.
             */}
            <h1
              className={
                "font-serif text-4xl md:text-5xl text-primary tracking-tight leading-[1.07] whitespace-pre-line lg:whitespace-nowrap " +
                (isArabic ? "lg:text-[3.75rem]" : "lg:text-[3.6rem]")
              }
            >
              {t("hero.title")}
            </h1>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-lg whitespace-pre-line">
              {t("hero.desc")}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/about"
                className="inline-flex items-center px-5 py-2.5 rounded-full bg-[color:var(--brand-magenta)]/10 text-[color:var(--brand-magenta)] text-sm font-medium hover:bg-[color:var(--brand-magenta)]/20 transition-colors"
              >
                {t("hero.btn.about")}
              </Link>
              <Link
                to="/projects/research"
                className="inline-flex items-center px-5 py-2.5 rounded-full bg-[color:var(--brand-cyan)]/60 text-foreground text-sm font-medium hover:bg-[color:var(--brand-cyan)]/80 transition-colors"
              >
                {t("hero.btn.research")}
              </Link>
            </div>
          </div>
        </section>

        {/* Latest News — prominently featured */}
        <section className="bg-gradient-to-b from-secondary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 rounded-full" style={{ background: "var(--brand-cyan)" }} />
                <div>
                  <div
                    className={
                      "uppercase tracking-[0.22em] text-[color:var(--brand-cyan)] font-semibold mb-1 " +
                      (isArabic ? "text-[14px]" : "text-[12px]")
                    }
                  >
                    {t("news.eyebrow")}
                  </div>
                  <h2
                    className={
                      "font-serif text-3xl text-primary " + (isArabic ? "lg:text-[2.65rem]" : "lg:text-[2.5rem]")
                    }
                  >
                    {t("news.title")}
                  </h2>
                </div>
              </div>
              <Link
                to="/media/news"
                className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors tracking-wide"
              >
                {t("news.viewAll")}
              </Link>
            </div>
            <LatestNewsAndAnnouncements />
          </div>
        </section>

        {/* Pillars */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {/* Meet the Team */}
        <TeamSection />
      </div>
    </PageLayout>
  );
}
