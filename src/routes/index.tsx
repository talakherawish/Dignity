import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Mail } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { getField, mapPayloadNews, type Article } from "@/data/articles";
import { withItalicQuotes } from "@/lib/text";
import {
  fetchNews,
  fetchParticipants,
  mediaUrl,
  PARTICIPANT_ROLE_LABEL,
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
    to: "/activities/forums",
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
  category: PayloadParticipant["category"];
  email: string;
  bio: string;
  bioAr: string;
  photo?: string;
};

function mapPayloadToTeamPerson(p: PayloadParticipant): TeamPerson {
  const role = PARTICIPANT_ROLE_LABEL[p.category];
  return {
    name: p.name,
    nameAr: p.nameAr ?? p.name,
    title: p.title ?? role.en,
    titleAr: p.titleAr ?? p.title ?? role.ar,
    category: p.category,
    email: p.email ?? "",
    bio: p.bio ?? "",
    bioAr: p.bioAr ?? p.bio ?? "",
    photo: mediaUrl(p.photo) || undefined,
  };
}

// ── Latest news and announcements: two independent halves ─────────────────
/**
 * LEFT half: a static, numbered list of the imageless entries (Payload's
 * `displayMode: "textOnly"`). Nothing here rotates -- it's a plain index, not
 * a slideshow.
 */
const HEADLINE_COUNT = 4;

/** RIGHT half: the entries with a cover image, cycling on their own clock. */
const CAROUSEL_COUNT = 6;
const CAROUSEL_INTERVAL_MS = 5000;

/** Numbers as 01, 02, ... in Western digits even beside Arabic text -- the
 * client asked not to use ar-EG's default Arabic-Indic numerals (١٢٣٤). */
function ordinal(index: number, isArabic: boolean): string {
  return (index + 1).toLocaleString(isArabic ? "ar-EG" : "en-US", {
    minimumIntegerDigits: 2,
    numberingSystem: "latn",
  });
}

function HeadlineList({ articles }: { articles: Article[] }) {
  const { lang, isArabic } = useLanguage();

  if (articles.length === 0) return null;

  return (
    <ul className="divide-y divide-border" dir={isArabic ? "rtl" : "ltr"}>
      {articles.map((article, index) => (
        <li key={article.id}>
          <Link
            to="/media/news"
            search={{ id: article.id }}
            className="group flex gap-4 px-5 py-2.5 transition-colors hover:bg-secondary/30"
          >
            <span className="font-serif text-sm tabular-nums text-muted-foreground/70">
              {ordinal(index, isArabic)}
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-[15px] leading-snug text-primary transition-colors group-hover:text-[color:var(--brand-magenta)]">
                {withItalicQuotes(getField(article, "title", lang))}
              </span>
              <span className="mt-1.5 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {getField(article, "date", lang)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Own timer, own index -- nothing ties this to the headline list beside it.
 * Fades between covers rather than sliding, so a portrait next to a landscape
 * cover doesn't lurch the frame sideways as it changes.
 */
function ImageCarousel({ articles }: { articles: Article[] }) {
  const { lang, isArabic } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeIndex = articles.length > 0 ? index % articles.length : 0;

  useEffect(() => {
    if (paused || articles.length <= 1) return;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % articles.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [index, paused, articles.length]);

  if (articles.length === 0) return null;
  const article = articles[safeIndex];

  return (
    <Link
      to="/media/news"
      search={{ id: article.id }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group relative block h-full min-h-[190px] overflow-hidden"
    >
      <img
        key={article.id}
        src={article.image}
        alt={getField(article, "title", lang)}
        className="absolute inset-0 h-full w-full animate-[fadeIn_0.5s_ease-out] object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 p-4" dir={isArabic ? "rtl" : "ltr"}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
          {getField(article, "date", lang)}
        </p>
        <h3 className="mt-1 font-serif text-base leading-snug text-white md:text-lg">
          {withItalicQuotes(getField(article, "title", lang))}
        </h3>
      </div>
    </Link>
  );
}

function LatestNewsAndAnnouncements() {
  const { isArabic } = useLanguage();

  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: payloadNews = [] } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
  });
  const articles = payloadNews.map(mapPayloadNews);
  const headlineArticles = articles
    .filter((a) => a.displayMode === "textOnly")
    .slice(0, HEADLINE_COUNT);
  const carouselArticles = articles
    .filter((a) => a.displayMode === "withImage" && a.image)
    .slice(0, CAROUSEL_COUNT);

  const hasHeadlines = headlineArticles.length > 0;
  const hasCarousel = carouselArticles.length > 0;
  if (!hasHeadlines && !hasCarousel) return null;

  // Split only once both sides actually have something to show -- otherwise
  // the row is a single full-width block, so an empty side never sits there
  // as wasted space (e.g. before any entry has been tagged textOnly, or if
  // every current entry happens to have a cover image).
  if (hasHeadlines && !hasCarousel) {
    return <HeadlineList articles={headlineArticles} />;
  }
  if (hasCarousel && !hasHeadlines) {
    return (
      <div className="overflow-hidden rounded-sm border border-border">
        <ImageCarousel articles={carouselArticles} />
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:min-h-[190px] md:grid-cols-2"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <HeadlineList articles={headlineArticles} />
      <ImageCarousel articles={carouselArticles} />
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
      <div
        className="relative w-full max-w-md"
        style={{ paddingTop: person.photo ? "112px" : "0px" }}
      >
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
            <p className="text-muted-foreground text-sm text-center mt-1">
              {lang === "ar" ? person.titleAr : person.title}
            </p>
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

  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: payloadParticipants = [] } = useQuery({
    queryKey: ["participants"],
    queryFn: fetchParticipants,
  });

  const members: TeamPerson[] = payloadParticipants.map(mapPayloadToTeamPerson).slice(0, 3);

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
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {lang === "ar" ? person.titleAr : person.title}
                    </div>
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

        {/* Hero — kept short on purpose: the news section right below it
            needs to be visible without scrolling, so this no longer claims
            the whole first screen the way it used to. */}
        <section className="relative">
          {/*
           * Temporary centered layout with the office photo dropped, while a
           * proper homepage design is worked out -- not the final treatment.
           */}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-4 lg:pt-4 lg:pb-5 flex flex-col items-center text-center">
            <div
              className={
                "uppercase tracking-[0.22em] text-[color:var(--brand-magenta)] font-semibold mb-2 " +
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
            <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-2xl whitespace-pre-line">
              {t("hero.desc")}
            </p>
          </div>
        </section>

        {/* News & Announcements — visible without scrolling, right under the
            hero: this is why the hero above no longer fills the screen. */}
        <section className="bg-gradient-to-b from-secondary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-1.5 rounded-full"
                  style={{ background: "var(--brand-cyan)" }}
                />
                <div>
                  <div
                    className={
                      "uppercase tracking-[0.22em] text-[color:var(--brand-cyan)] font-semibold mb-0.5 " +
                      (isArabic ? "text-[14px]" : "text-[12px]")
                    }
                  >
                    {t("news.eyebrow")}
                  </div>
                  <h2
                    className={
                      "font-serif text-2xl text-primary " +
                      (isArabic ? "lg:text-[2rem]" : "lg:text-[1.9rem]")
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
