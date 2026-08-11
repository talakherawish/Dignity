import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Mail } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import officeImg from "@/assets/dignity-office.jpg";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { ARTICLES, getField, mapPayloadNews } from "@/data/articles";
import { withItalicQuotes } from "@/lib/text";
import {
  fetchNews,
  fetchAnnouncements,
  fetchParticipants,
  formatDate,
  mediaUrl,
  type PayloadAnnouncement,
  type PayloadParticipant,
} from "@/lib/payload";

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

// ── Latest news: one story large, the rest as a numbered index ────────────
/**
 * The feature rotates every five seconds and the index marks whichever story
 * is showing, so the two halves always agree. Picking a heading jumps to it.
 *
 * This replaced a slide carousel whose only navigation was three arrow
 * buttons and a row of dots -- controls that said nothing about what they
 * would show. The headings are the navigation now, which is why the arrows
 * and dots are gone.
 */

/**
 * Capped in viewport units rather than by aspect ratio alone: an aspect ratio
 * grows with the column, and a picture taller than the window cannot be seen
 * at all. The headline sits over the foot of this one, so it has to stay on
 * screen.
 */
const FEATURE_HEIGHT = "h-[clamp(16rem,50vh,28rem)]";

/** Enough to fill the index beside the picture without it sprawling. */
const FEATURED_COUNT = 4;

function LatestNews() {
  const { t, lang, isArabic } = useLanguage();
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  const { data: payloadNews = [] } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000,
  });
  const articles = (payloadNews.length > 0 ? payloadNews.map(mapPayloadNews) : ARTICLES).slice(
    0,
    FEATURED_COUNT,
  );

  const goTo = useCallback((next: number) => {
    setVisible(false);
    setTimeout(() => {
      setI(next);
      setVisible(true);
    }, 240);
  }, []);

  // articles.length belongs in the deps: the Payload feed arrives after mount
  // and usually has a different number of entries than the built-in fallback,
  // so an interval left over from the old length would wrap at the wrong point.
  const slideCount = articles.length;
  useEffect(() => {
    if (paused || slideCount < 2) return;
    const id = setInterval(() => goTo((i + 1) % slideCount), 5000);
    return () => clearInterval(id);
  }, [i, paused, goTo, slideCount]);

  if (slideCount === 0) return null;

  const article = articles[Math.min(i, slideCount - 1)];
  const fade = { opacity: visible ? 1 : 0, transition: "opacity 0.24s ease" } as const;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-12"
    >
      <Link
        to="/media/news"
        aria-label={getField(article, "title", lang)}
        className="group block overflow-hidden rounded-sm border border-border"
      >
        {/* Without a picture the gradient has nothing to darken, so the panel
            brings its own ground rather than putting white text on white. */}
        <div className={"relative " + FEATURE_HEIGHT + (article.image ? "" : " bg-primary")}>
          {article.image && (
            /*
             * The cross-fade and the hover zoom share one inline `transition`,
             * because an inline style overrides Tailwind's transition utility
             * outright and the fade has to be declared here -- it depends on
             * component state.
             *
             * It names `scale`, not `transform`: Tailwind v4 compiles
             * scale-[1.03] to the standalone `scale` property (confirmed in
             * the built CSS), so a transition covering `transform` leaves the
             * zoom untransitioned and the picture snaps. Tailwind's own
             * transition-transform covers transform, translate, scale and
             * rotate together, which is why it never had this problem.
             */
            <img
              src={article.image}
              alt={getField(article, "title", lang)}
              style={{
                opacity: visible ? 1 : 0,
                transition: "opacity 0.24s ease, scale 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                willChange: "scale, opacity",
              }}
              className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.03] motion-reduce:scale-100"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-9" style={fade}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-magenta)]">
              {t("news.eyebrow")}
            </p>
            <h3 className="max-w-3xl font-serif text-2xl leading-tight text-white md:text-[2rem]">
              {withItalicQuotes(getField(article, "title", lang))}
            </h3>
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/75">
              {getField(article, "excerpt", lang)}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                {getField(article, "date", lang)}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white group-hover:underline">
                {t("news.readMore")}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div>
        <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {isArabic ? "أحدث الأخبار" : "Latest stories"}
        </p>
        <ul className="border-t border-border">
          {articles.map((entry, index) => {
            const active = index === i;
            // Arabic-Indic numerals beside Arabic dates, Latin beside English.
            const number = (index + 1).toLocaleString(isArabic ? "ar-EG" : "en-US", {
              minimumIntegerDigits: 2,
            });

            return (
              <li key={entry.id} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-current={active ? "true" : undefined}
                  className={
                    "group flex w-full gap-4 border-s-2 py-5 ps-4 text-start transition-colors duration-300 " +
                    (active ? "border-[color:var(--brand-magenta)]" : "border-transparent")
                  }
                >
                  <span className="font-serif text-sm tabular-nums text-muted-foreground/70">
                    {number}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={
                        "block font-serif text-[15px] leading-snug transition-colors duration-300 " +
                        (active
                          ? "text-[color:var(--brand-magenta)]"
                          : "text-primary group-hover:text-[color:var(--brand-magenta)]")
                      }
                    >
                      {withItalicQuotes(getField(entry, "title", lang))}
                    </span>
                    <span className="mt-1.5 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {getField(entry, "date", lang)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function AnnouncementsSection() {
  const { t, lang, isArabic } = useLanguage();

  const { data: items = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    staleTime: 5 * 60 * 1000,
  });

  // Every announcement comes from Payload. With nothing authored (or the
  // backend unreachable, which fetchAnnouncements reports as an empty list)
  // the whole block goes away rather than leaving a heading over an empty
  // grid — the homepage shouldn't advertise announcements there aren't any of.
  if (items.length === 0) return null;

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
          <Link
            to="/media/announcements"
            className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors tracking-wide"
          >
            {t("news.viewAll")}
          </Link>
        </div>

        <div
          className="announcements-grid grid gap-4 sm:grid-cols-3"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {items.map((item: PayloadAnnouncement) => (
            <Link
              key={item.id}
              to="/media/announcements"
              className="group block bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <div className="h-1 w-full" style={{ background: "var(--brand-magenta)" }} />
              <div className={`p-6 ${isArabic ? "text-right" : ""}`}>
                <div
                  className={`font-semibold mb-2 text-muted-foreground ${isArabic ? "text-sm" : "text-[11px] uppercase tracking-widest"}`}
                >
                  {isArabic ? "إعلان" : "Announcement"}
                </div>
                <p
                  className={`font-medium text-primary leading-snug group-hover:text-accent transition-colors mb-4 ${isArabic ? "text-base" : "text-sm"}`}
                >
                  {lang === "ar" ? (item.titleAr ?? item.title) : item.title}
                </p>
                <div
                  className={`font-medium tracking-wide ${isArabic ? "text-sm" : "text-[12px]"}`}
                  style={{ color: "var(--brand-magenta)" }}
                >
                  {formatDate(item.date, lang === "ar" ? "ar" : "en")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
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
      {/* Sized to match FellowModal on /about/participants — the two are the
          same card and should stay in step. */}
      <div className="relative w-full max-w-md" style={{ paddingTop: "112px" }}>
        {/* Floating avatar */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 z-10">
          <div className="h-56 w-56 rounded-full overflow-hidden shadow-2xl bg-secondary flex items-center justify-center">
            {person.photo ? (
              <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-20 w-20 text-muted-foreground/25"
                aria-hidden
              >
                <circle cx="12" cy="8" r="4.5" fill="currentColor" />
                <path d="M3 20c0-4.4 4-8 9-8s9 3.6 9 8" fill="currentColor" />
              </svg>
            )}
          </div>
        </div>
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
          <div className="px-8 pb-8" style={{ paddingTop: "116px" }}>
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
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-center">
            <div>
              <div className="text-[12px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-2">
                {t("team.eyebrow")}
              </div>
              <h2 className="font-serif text-2xl lg:text-[2rem] text-primary leading-tight mb-5">
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
                  <div className="shrink-0 h-[52px] w-[52px] rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center">
                    {person.photo ? (
                      <img
                        src={person.photo}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6 text-muted-foreground/40"
                        aria-hidden
                      >
                        <circle cx="12" cy="8" r="4" fill="currentColor" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
                      </svg>
                    )}
                  </div>
                  <div className={"min-w-0 pt-0.5" + (isArabic ? " text-right" : "")}>
                    <div className="font-semibold text-sm text-primary leading-tight group-hover:text-accent transition-colors">
                      {lang === "ar" ? person.nameAr : person.name}
                    </div>
                    {(person.title || person.titleAr) && (
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {lang === "ar" ? person.titleAr : person.title}
                      </div>
                    )}
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
  const { t } = useLanguage();
  return (
    <PageLayout>
      {/* Hero */}
      <section className="border-b border-border relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-cyan)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-magenta)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="text-[12px] uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-4">
              {t("hero.eyebrow")}
            </div>
            {/*
             * whitespace-pre-line so a line break typed into the Hero Title or
             * Hero Description in Site Settings is the line break shown here.
             * Both are textarea fields, so the newline was always stored -- it
             * was HTML that collapsed it into a space, which made pressing
             * Enter in the admin look like it did nothing.
             */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.6rem] text-primary tracking-tight leading-[1.07] whitespace-pre-line">
              {t("hero.title")}
            </h1>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-lg whitespace-pre-line">
              {t("hero.desc")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/about"
                className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors"
              >
                {t("hero.btn.about")}
              </Link>
              <Link
                to="/projects/research"
                className="inline-flex items-center px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-sm hover:bg-secondary transition-colors"
              >
                {t("hero.btn.research")}
              </Link>
            </div>
          </div>
          {/* The initiative's entrance at Birzeit's Faculty of Graduate Studies
              and Research. `aspect-[3/2]` matches the placeholder this replaced,
              so the hero's two columns stay balanced; the photo is 4:3, so
              object-cover trims the top and bottom rather than letterboxing. */}
          <img
            src={officeImg}
            alt="Entrance to the Dignity Initiative at Birzeit University's Faculty of Graduate Studies and Research"
            loading="eager"
            className="w-full aspect-[3/2] object-cover rounded-sm border border-border"
          />
        </div>
      </section>

      {/* Latest News — prominently featured */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full" style={{ background: "var(--brand-cyan)" }} />
              <div>
                <div className="text-[12px] uppercase tracking-[0.22em] text-[color:var(--brand-cyan)] font-semibold mb-1">
                  {t("news.eyebrow")}
                </div>
                <h2 className="font-serif text-3xl lg:text-[2.5rem] text-primary">
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
          <LatestNews />
        </div>
      </section>

      {/* Pillars */}
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

      {/* Announcements */}
      <AnnouncementsSection />

      {/* Meet the Team */}
      <TeamSection />
    </PageLayout>
  );
}
