import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X, Mail } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { excerptUntranslated, getField, mapPayloadNews, type Article } from "@/data/articles";
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

// ── Latest news and announcements: an auto-advancing carousel of slots ────
/** Enough for a handful of slots without turning the teaser into the archive. */
const QUEUE_SIZE = 6;

/** Within the "every ~5-6s" the design calls for. */
const SLOT_INTERVAL_MS = 5500;

/**
 * A slot is one 2-column row of the carousel. An item with its own image
 * fills a slot by itself, image on one side and its own text on the other.
 * Two imageless items sit side by side sharing a slot -- both text-only, same
 * treatment either would get alone -- and a leftover imageless item with no
 * imageless neighbour spans the row alone rather than leaving a column empty.
 */
type Slot =
  | { kind: "image"; article: Article }
  | { kind: "pair"; a: Article; b: Article }
  | { kind: "wide"; article: Article };

/**
 * Pairing only ever looks at the very next item in the queue -- not the next
 * imageless item however far off -- so a slot never reaches past an image
 * item to grab a partner from further down the list, which would reorder the
 * feed out of its latest-first order.
 */
function buildSlots(articles: Article[]): Slot[] {
  const slots: Slot[] = [];
  let i = 0;
  while (i < articles.length) {
    const article = articles[i];
    if (article.image) {
      slots.push({ kind: "image", article });
      i += 1;
      continue;
    }
    const next = articles[i + 1];
    if (next && !next.image) {
      slots.push({ kind: "pair", a: article, b: next });
      i += 2;
    } else {
      slots.push({ kind: "wide", article });
      i += 1;
    }
  }
  return slots;
}

/** The text half of a slot: date, title, excerpt (or a notice standing in for it). */
function NewsSlotCard({ article, className = "" }: { article: Article; className?: string }) {
  const { lang, isArabic } = useLanguage();
  const excerpt = getField(article, "excerpt", lang);

  return (
    <Link
      to="/media/news"
      search={{ id: article.id }}
      className={
        "group flex h-[240px] flex-col justify-center overflow-hidden rounded-sm border border-border bg-card p-6 transition-colors hover:border-accent/30 hover:shadow-sm " +
        className
      }
    >
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
          "mt-2 line-clamp-3 font-serif text-lg leading-snug text-primary transition-colors group-hover:text-accent " +
          (isArabic ? "md:text-[21px]" : "md:text-xl")
        }
      >
        {withItalicQuotes(getField(article, "title", lang))}
      </h3>
      {excerpt ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
      ) : (
        excerptUntranslated(article, lang) && <TranslationNotice compact className="mt-2" />
      )}
    </Link>
  );
}

function NewsSlot({ slot }: { slot: Slot }) {
  const { lang, isArabic } = useLanguage();

  if (slot.kind === "wide") {
    return (
      <div className="flex" dir={isArabic ? "rtl" : "ltr"}>
        <NewsSlotCard article={slot.article} className="w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2" dir={isArabic ? "rtl" : "ltr"}>
      {slot.kind === "image" ? (
        <>
          <NewsSlotCard article={slot.article} />
          {/* Only ever the item's own image -- a slot is built around having
              one, so there is never a stand-in photo needing a caveat. */}
          <div className="overflow-hidden rounded-sm border border-border">
            <img
              src={slot.article.image}
              alt={getField(slot.article, "title", lang)}
              loading="lazy"
              className="h-48 w-full object-cover sm:h-[240px]"
            />
          </div>
        </>
      ) : (
        <>
          <NewsSlotCard article={slot.a} />
          <NewsSlotCard article={slot.b} />
        </>
      )}
    </div>
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
  const articles = payloadNews.map(mapPayloadNews).slice(0, QUEUE_SIZE);
  const slots = buildSlots(articles);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeIndex = slots.length > 0 ? index % slots.length : 0;

  // Restarts on every slide change, whether that came from this timeout or
  // from a manual dot/arrow click, and stops while paused -- so hovering
  // away and back simply gives the new slide a fresh full interval rather
  // than resuming a partial one.
  useEffect(() => {
    if (paused || slots.length <= 1) return;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % slots.length);
    }, SLOT_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [index, paused, slots.length]);

  if (slots.length === 0) return null;

  const step = (delta: number) => setIndex((i) => (i + delta + slots.length) % slots.length);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div key={safeIndex} className="animate-[fadeIn_0.5s_ease-out]">
        <NewsSlot slot={slots[safeIndex]} />
      </div>

      {slots.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3" dir={isArabic ? "rtl" : "ltr"}>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={isArabic ? "السابق" : "Previous"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-accent"
          >
            <ChevronLeft className={"h-4 w-4" + (isArabic ? " rotate-180" : "")} />
          </button>

          <div className="flex items-center gap-2">
            {slots.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={isArabic ? `الانتقال إلى الشريحة ${i + 1}` : `Go to slide ${i + 1}`}
                aria-current={i === safeIndex}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (i === safeIndex
                    ? "w-7 bg-[color:var(--brand-magenta)]"
                    : "w-1.5 bg-border hover:bg-muted-foreground/40")
                }
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            aria-label={isArabic ? "التالي" : "Next"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-accent"
          >
            <ChevronRight className={"h-4 w-4" + (isArabic ? " rotate-180" : "")} />
          </button>
        </div>
      )}
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
                <div
                  className="h-6 w-1.5 rounded-full"
                  style={{ background: "var(--brand-cyan)" }}
                />
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
                      "font-serif text-3xl text-primary " +
                      (isArabic ? "lg:text-[2.65rem]" : "lg:text-[2.5rem]")
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
