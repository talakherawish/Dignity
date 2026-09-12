import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X, Mail } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Reveal } from "@/components/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { getField, mapPayloadNews, type Article } from "@/data/articles";
import { withItalicQuotes } from "@/lib/text";
import {
  fetchNews,
  fetchParticipants,
  fetchPublications,
  mediaUrl,
  PARTICIPANT_ROLE_LABEL,
  type PayloadParticipant,
  type PayloadPublication,
} from "@/lib/payload";

/**
 * Shared by every "one screen" section on this page: the hero, News &
 * Announcements, and Posters. The header is sticky and sits in normal flow
 * above whichever of these comes first -- it never overlaps them -- so
 * every one of these sections needs the same reduced height (100dvh minus
 * the header's own height at each breakpoint) to actually look like "one
 * screen" consistently, rather than the hero being shorter than the ones
 * that follow it by exactly the header's height.
 */
const FULL_SCREEN_SECTION = "h-[calc(100dvh-62px)] sm:h-[calc(100dvh-82px)] lg:h-[calc(100dvh-103px)]";

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
 * The text list: a static, numbered list of the imageless entries (Payload's
 * `displayMode: "textOnly"`). Nothing here rotates -- it's a plain index, not
 * a slideshow. Which physical side it renders on depends on language --
 * see LatestNewsAndAnnouncements below.
 */
const HEADLINE_COUNT = 4;

/** The other half: the entries with a cover image, cycling on their own clock. */
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
    <div className="flex h-full min-h-0 flex-col justify-center" dir={isArabic ? "rtl" : "ltr"}>
      <ul className="divide-y divide-border">
        {articles.map((article, index) => (
          <li key={article.id}>
            <Link
              to="/media/news"
              search={{ id: article.id }}
              className="group flex gap-4 px-2 py-3 transition-colors hover:bg-secondary/30 md:py-4"
            >
              <span className="font-serif text-sm tabular-nums text-muted-foreground/70">
                {ordinal(index, isArabic)}
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-base leading-snug text-primary transition-colors group-hover:text-[color:var(--brand-magenta)] md:text-lg">
                  {withItalicQuotes(getField(article, "title", lang))}
                </span>
                <span className="mt-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {getField(article, "date", lang)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
      className="group relative block h-full overflow-hidden"
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
      <div className="h-full overflow-hidden rounded-sm border border-border">
        <ImageCarousel articles={carouselArticles} />
      </div>
    );
  }

  // The image and the text list are meant to sit on fixed physical sides
  // per the client's request -- image on the right / text on the left in
  // Arabic, mirrored in English -- rather than following whichever side
  // "comes first" in the reading direction. A CSS grid under dir="rtl"
  // already mirrors column order on its own, so putting the image first in
  // source order here is what lands it on the right in Arabic (col 1 sits
  // on the physical right under RTL) and on the left in English (col 1 sits
  // on the physical left under LTR) -- both in one layout, no per-language
  // branch needed.
  return (
    <div
      className="grid h-full min-h-0 grid-cols-1 gap-8 md:grid-cols-[2fr_3fr] md:gap-12"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <ImageCarousel articles={carouselArticles} />
      <HeadlineList articles={headlineArticles} />
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
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
              "font-serif text-2xl text-primary leading-tight mb-10 " +
              (isArabic ? "lg:text-[2.125rem]" : "lg:text-[2rem]")
            }
          >
            {t("team.title")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {members.map((person, idx) => (
              <button
                key={idx}
                onClick={() => setSelected(person)}
                className="group flex flex-col items-center text-center"
              >
                <div className="h-28 w-28 rounded-full overflow-hidden bg-secondary shadow-sm ring-1 ring-border group-hover:ring-accent/40 transition-all duration-200">
                  {person.photo ? (
                    <img
                      src={person.photo}
                      alt={person.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-muted-foreground">
                      {(lang === "ar" ? person.nameAr : person.name).charAt(0)}
                    </div>
                  )}
                </div>
                <div className="font-semibold text-sm text-primary mt-4 group-hover:text-accent transition-colors">
                  {lang === "ar" ? person.nameAr : person.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {lang === "ar" ? person.titleAr : person.title}
                </div>
                <div className="text-[11px] font-medium text-green-600 mt-1 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {isArabic ? "اضغط لقراءة المزيد" : "Click to read more"}
                </div>
              </button>
            ))}
          </div>

          <Link
            to="/about/participants"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground border border-border px-5 py-2.5 rounded-full hover:bg-secondary transition-colors mt-10"
          >
            {t("team.btn")} <span aria-hidden>{isArabic ? "←" : "→"}</span>
          </Link>
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

// ── Posters showcase: a horizontally-scrollable teaser for /publications/posters
const POSTER_COUNT = 10;

/** Same preview-source fallback PublicationsPage uses: a real image if the
 * upload is one, otherwise the auto-generated PDF page-1 thumbnail. */
function posterPreviewUrl(item: PayloadPublication): string {
  const imageIsPhoto = item.image?.mimeType?.startsWith("image/") ?? false;
  const previewSource = imageIsPhoto ? item.image : (item.image?.thumbnail ?? item.file?.thumbnail);
  return previewSource ? mediaUrl(previewSource) : "";
}

function PostersShowcase() {
  const { t, isArabic } = useLanguage();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // No staleTime: same reasoning as every other homepage query -- a newly
  // published poster should show up here on the next load, not later.
  const { data: payloadPosters = [] } = useQuery({
    queryKey: ["publications", "posters"],
    queryFn: () => fetchPublications("posters"),
  });

  const posters = payloadPosters
    .map((item) => ({
      id: item.id,
      title: item.title,
      titleAr: item.titleAr,
      image: posterPreviewUrl(item),
      fileUrl: mediaUrl(item.file),
    }))
    .filter((p) => p.image)
    .slice(0, POSTER_COUNT);

  // Payload is the only source, same as everywhere else on this page -- no
  // posters published yet means no section, not a row of empty frames.
  if (posters.length === 0) return null;

  // Physical, not logical: "left" always nudges the viewport toward lower
  // scrollLeft values and "right" toward higher ones, regardless of
  // language. That's the correct thing to bind two fixed-position buttons
  // to either way, and it sidesteps the well-known cross-browser
  // inconsistency in what a *positive* scrollLeft means inside a
  // dir="rtl" container.
  const nudge = (pixels: number) => {
    scrollerRef.current?.scrollBy({ left: pixels, behavior: "smooth" });
  };

  return (
    // FULL_SCREEN_SECTION, not h-dvh: everything in this section is fixed
    // copy this component wrote itself, so there's no variable-length
    // content that could need more room -- a hard cap is safe, and it has
    // to be the same reduced height as the hero and News, not a flat
    // 100dvh, or this section reads as taller than both of them.
    <section className={`mt-8 flex w-full flex-col overflow-hidden bg-[#4b5563] py-6 md:mt-14 md:py-8 ${FULL_SCREEN_SECTION}`}>
      {/* Heading stays in a readable centered column like every other
          section's text; the row below it deliberately breaks out of that
          same max-w-7xl column to run full-bleed, edge to edge like the
          hero video -- that contrast (boxed text, full-width media) is the
          same pattern News & Announcements uses right above it. */}
      <div className="mx-auto mb-4 flex w-full max-w-7xl shrink-0 flex-col items-center px-4 text-center sm:px-6 md:mb-6 lg:px-8">
        <h2 className="mb-4 font-serif text-2xl text-white md:text-3xl">{t("posters.title")}</h2>
        <Link
          to="/publications/posters"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
        >
          {t("posters.viewAll")} <span aria-hidden>{isArabic ? "←" : "→"}</span>
        </Link>
      </div>

      {/* min-h-0 is load-bearing, not decorative: without it, a flex child's
          default min-height:auto refuses to shrink below its own content's
          size -- and since the cards inside are sized off *this* box's
          height, that turns into a feedback loop where the row inflates to
          the posters' raw upload dimensions (hundreds of px taller than the
          section), and the section's own layout has nowhere to put that
          extra height except overflow above and below it. This exact bug is
          what a user report of "posters are huge, overriding above and
          below the grey background" traced back to. */}
      <div className="relative min-h-0 w-full flex-1">
        <div
          ref={scrollerRef}
          className="scrollbar-none flex h-full snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-2 sm:px-6 md:gap-8 lg:px-8"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {posters.map((poster) => (
            <a
              key={poster.id}
              href={poster.fileUrl || poster.image}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full shrink-0 snap-start"
            >
              <div className="h-full aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                <img
                  src={poster.image}
                  alt={isArabic ? (poster.titleAr ?? poster.title) : poster.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </a>
          ))}
        </div>

        {/* Discoverability nudge for pointer users who might not notice
            the row scrolls -- touch/trackpad/shift+wheel already work
            without these. Inset (not offset outside the row) now that the
            row itself runs to the screen edge -- there's no longer any
            margin outside it to sit in. */}
        {posters.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => nudge(-320)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-lg transition-transform hover:scale-105 md:flex md:left-4"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => nudge(320)}
              aria-label="Next"
              className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-lg transition-transform hover:scale-105 md:right-4 md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </section>
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
 * dozen pixels. Every other "one screen" section on this page (News,
 * Posters) shares this same FULL_SCREEN_SECTION height for exactly that
 * reason -- they'd otherwise end up taller than the hero by the header's
 * height, since only the hero sits directly under it.
 */
function HeroVideo() {
  const { t, isArabic } = useLanguage();
  return (
    <section className={`relative w-full overflow-hidden bg-black ${FULL_SCREEN_SECTION}`}>
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
        {/* Reveal is the same fade-up-on-appear wrapper used for Pillars and
            Team below -- here it's already in view on page load, so it
            simply fades the whole text block in as soon as the video mounts
            rather than waiting for a scroll. */}
        <Reveal className="flex flex-col items-center">
          <p
            className={
              "uppercase tracking-[0.22em] text-white/90 font-semibold mb-3 " +
              (isArabic ? "text-[14px] md:text-[15px]" : "text-[12px] md:text-[13px]")
            }
          >
            {t("hero.eyebrow")}
          </p>
          {/*
           * whitespace-pre-line so a line break typed into the Hero Title or
           * Hero Description in Site Settings is the line break shown here.
           * Both are textarea fields, so the newline was always stored -- it
           * was HTML that collapsed it into a space, which made pressing
           * Enter in the admin look like it did nothing.
           *
           * lg:whitespace-nowrap forces the title onto one line at desktop
           * widths, same as the previous hero did -- font metrics for the
           * Arabic serif fallback vary enough across systems that a
           * width-based fit can't be guaranteed, so the two languages get
           * separately-tuned sizes rather than one shared one.
           */}
          <h1
            className={
              "font-serif text-4xl md:text-5xl text-white tracking-tight leading-[1.1] whitespace-pre-line lg:whitespace-nowrap " +
              (isArabic ? "lg:text-[3.75rem]" : "lg:text-[3.6rem]")
            }
          >
            {t("hero.title")}
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/85 leading-relaxed max-w-2xl whitespace-pre-line">
            {t("hero.desc")}
          </p>
        </Reveal>
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

        {/* News & Announcements — its own full-screen section right after
            the hero video, sized to match it exactly (FULL_SCREEN_SECTION,
            the same reduced height the hero uses, not a flat 100dvh -- see
            that constant's own comment). It's a hard cap: overflow-hidden
            is the backstop in case a real editor-typed headline is ever
            long enough to want more room than that -- it loses a sliver of
            padding on the very last row rather than pushing the section,
            and everything after it, past one screen. */}
        <section
          className={`flex w-full flex-col overflow-hidden bg-gradient-to-b from-secondary/5 to-transparent ${FULL_SCREEN_SECTION}`}
        >
          {/* Heading in a readable centered column, same as the site's other
              section headers; the row below breaks out of that column to
              run full-bleed like the hero video and the Posters row below
              it -- see this section's own py-6 wrapper for why. */}
          <div className="mx-auto mb-4 flex w-full max-w-7xl shrink-0 items-center justify-between px-4 pt-6 sm:px-6 md:mb-6 md:pt-8 lg:px-8">
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
          {/* min-h-0 is load-bearing here too -- see the identical comment
              on the Posters section below. Without it, this flex child
              refuses to shrink below the image carousel's own content
              size, which is what let the whole row (and the section around
              it) balloon well past one screen. */}
          <div className="min-h-0 w-full flex-1 px-4 pb-6 sm:px-6 md:pb-8 lg:px-8">
            <LatestNewsAndAnnouncements />
          </div>
        </section>

        {/* Posters */}
        <PostersShowcase />

        {/* Meet the Team */}
        <Reveal>
          <TeamSection />
        </Reveal>
      </div>
    </PageLayout>
  );
}
