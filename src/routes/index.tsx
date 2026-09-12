import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Mail } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Reveal } from "@/components/Reveal";
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
const HEADLINE_COUNT = 3;

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
            className="group flex gap-4 px-5 py-4 transition-colors hover:bg-secondary/30"
          >
            <span className="font-serif text-base tabular-nums text-muted-foreground/70">
              {ordinal(index, isArabic)}
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-lg leading-snug text-primary transition-colors group-hover:text-[color:var(--brand-magenta)]">
                {withItalicQuotes(getField(article, "title", lang))}
              </span>
              <span className="mt-2 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
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
  const textOnlyArticles = articles.filter((a) => a.displayMode === "textOnly");
  const carouselArticles = articles
    .filter((a) => a.displayMode === "withImage" && a.image)
    .slice(0, CAROUSEL_COUNT);
  // The left column prefers dedicated text-only entries, but a handful of
  // those next to a full CAROUSEL_COUNT carousel reads as broken, not sparse
  // -- so once those run out, pad with whatever's left (image entries too,
  // shown here without their image) up to HEADLINE_COUNT.
  const headlineArticles = [
    ...textOnlyArticles,
    ...articles.filter((a) => !textOnlyArticles.includes(a)),
  ].slice(0, HEADLINE_COUNT);

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

// ── Hero: full-viewport looping video with text overlay ───────────────────
/**
 * dvh, not vh: on mobile, 100vh includes the space behind the browser's
 * address bar, so a 100vh section is taller than what's actually visible and
 * the page loads pre-scrolled. dvh ("dynamic viewport height") tracks the
 * real visible area on every device -- it's what makes "one full screen"
 * mean the same thing on a phone as it does on a laptop.
 *
 * The header is sticky, not overlaid on top of the hero, so it still takes
 * up its own space above it (60px / 80px / 101px, plus its 1px accent bar
 * and 1px border, at the same mobile/sm/lg breakpoints SiteHeader uses).
 * Subtracting that from the hero's height is what makes "header + hero"
 * land on exactly one screen instead of one screen plus a sliver -- without
 * it, every page load would open with the hero already cut off by a few
 * dozen pixels.
 */
function HeroVideo() {
  const { t } = useLanguage();
  return (
    <section className="relative h-[calc(100dvh-62px)] sm:h-[calc(100dvh-82px)] lg:h-[calc(100dvh-103px)] w-full overflow-hidden bg-black">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/landing.mp4"
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        controlsList="nodownload noremoteplayback nofullscreen"
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <p className="uppercase tracking-[0.22em] text-white/90 font-semibold mb-3 text-[12px] md:text-[13px]">
          {t("hero.eyebrow")}
        </p>
        {/*
         * whitespace-pre-line so a line break typed into the Hero Title or
         * Hero Description in Site Settings is the line break shown here.
         * Both are textarea fields, so the newline was always stored -- it
         * was HTML that collapsed it into a space, which made pressing
         * Enter in the admin look like it did nothing.
         */}
        <h1 className="font-serif text-4xl md:text-6xl text-white tracking-tight leading-[1.1] whitespace-pre-line max-w-4xl">
          {t("hero.title")}
        </h1>
        <p className="mt-5 text-base md:text-lg text-white/85 leading-relaxed max-w-2xl whitespace-pre-line">
          {t("hero.desc")}
        </p>
      </div>
    </section>
  );
}

// ── Home page ─────────────────────────────────────────────────────────────
function Home() {
  const { t, isArabic } = useLanguage();
  return (
    <PageLayout>
      <HeroVideo />

      {/* Shared backdrop for everything below the hero: soft cyan/magenta
          blobs staggered down the scroll length, so the color motif carries
          through the page. vh-based offsets rather than fixed pixels, since
          the sections below are variable height. */}
      <div className="relative overflow-hidden">
        <div
          className="absolute -top-16 -right-32 h-96 w-96 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-cyan)" }}
        />
        <div
          className="absolute top-16 -left-20 h-56 w-56 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-magenta)" }}
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

        {/* News & Announcements — its own white section right after the
            hero video, with the site's usual cyan/magenta accents. */}
        <section className="bg-gradient-to-b from-secondary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-1.5 rounded-full"
                  style={{ background: "var(--brand-cyan)" }}
                />
                <h2
                  className={
                    "font-serif text-2xl text-primary " +
                    (isArabic ? "lg:text-[2rem]" : "lg:text-[1.9rem]")
                  }
                >
                  {t("news.title")}
                </h2>
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
            {PILLARS.map((p, idx) => (
              <Reveal key={p.titleKey} delay={idx * 100}>
                <Link to={p.to} className="group block">
                  <div className="border-t-2 pt-5" style={{ borderColor: p.color }}>
                    <h3 className="font-serif text-xl text-primary mb-2 group-hover:text-accent transition-colors">
                      {t(p.titleKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(p.descKey)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Meet the Team */}
        <Reveal>
          <TeamSection />
        </Reveal>
      </div>
    </PageLayout>
  );
}
