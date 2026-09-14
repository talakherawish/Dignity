import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Mail } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchParticipants,
  mediaUrl,
  PARTICIPANT_ROLE_LABEL,
  type PayloadParticipant,
} from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

/** ?participant=<id> deep-links to one profile -- used by a photo's tagged
 * people (see PhotoGallery's "With: ..." tags) -- opening that person's
 * modal once the list has loaded. */
type ParticipantsSearch = { participant?: string };

export const Route = createFileRoute("/about/participants")({
  validateSearch: (search: Record<string, unknown>): ParticipantsSearch => ({
    participant: typeof search.participant === "string" ? search.participant : undefined,
  }),
  component: ParticipantsPage,
});

type Participant = {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  category:
    | "researcher"
    | "visitor"
    | "student"
    | "speaker"
    | "author"
    | "team_member"
    | "intern"
    | "practical_support";
  email: string;
  bio: string;
  bioAr: string;
  photo?: string;
};

/**
 * Speakers and Authors have their own toggle (see isVisible) and no pill of
 * their own -- they're reachable from the publications/photos that credit
 * them, not from browsing this page. Team Members has no pill either: those
 * people show up under Practical Support instead (see matchesCategory).
 */
const CATEGORIES = [
  { value: "all", en: "All", ar: "الكل" },
  { value: "researcher", en: "Researchers", ar: "باحثون" },
  { value: "visitor", en: "Visitors", ar: "زائرون" },
  { value: "student", en: "Students", ar: "طلاب" },
  { value: "intern", en: "Interns", ar: "متدربات ومتدربون" },
  { value: "practical_support", en: "Practical Support", ar: "الدعم العملي" },
];

/** Authors and Speakers are hidden unless the CMS entry opts back in. */
function isVisible(p: PayloadParticipant): boolean {
  if (p.category === "author" || p.category === "speaker") {
    return p.showOnWorkingGroupPage === true;
  }
  return true;
}

/** Team Member counts as Practical Support here -- the two share one pill. */
function matchesCategory(category: Participant["category"], activeCategory: string): boolean {
  if (activeCategory === "all") return true;
  if (activeCategory === "practical_support") {
    return category === "practical_support" || category === "team_member";
  }
  return category === activeCategory;
}

function mapPayloadParticipant(p: PayloadParticipant): Participant {
  const role = PARTICIPANT_ROLE_LABEL[p.category];
  return {
    id: p.id,
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

function ParticipantModal({
  participant,
  onClose,
  isArabic,
  lang,
}: {
  participant: Participant;
  onClose: () => void;
  isArabic: boolean;
  lang: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* The avatar overlaps the card: its vertical center sits on the
          card's top edge, half poking up above it. The spacer above the
          card reserves exactly that top half's height (h-20/sm:h-24, half
          of the avatar's own h-40/sm:h-48) so the photo has room to float
          there; the card's matching pt-24/sm:pt-28 leaves the same amount
          of clearance inside so its bottom half doesn't sit under the name.
          Unlike the earlier version of this layout (see git history), the
          whole wrapper is capped at max-h-[90vh] via flex-col + flex-1
          min-h-0 on the card, so only the card scrolls internally -- a long
          bio can't push the avatar or the modal itself past the viewport.
          Matches TeamModal on the homepage. */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col">
        {participant.photo && <div className="h-20 sm:h-24 shrink-0" aria-hidden />}
        <div
          className={
            "relative flex-1 min-h-0 bg-card border border-border rounded-lg shadow-2xl overflow-y-auto" +
            (isArabic ? " text-right" : "")
          }
        >
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
            {participant.email && (
              <a
                href={"mailto:" + participant.email}
                title={participant.email}
                aria-label={participant.email}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div
            className={
              "flex flex-col items-center px-8 pb-8 text-center " +
              (participant.photo ? "pt-24 sm:pt-28" : "pt-12")
            }
          >
            <h2 className="font-serif text-2xl text-primary">
              {lang === "ar" ? participant.nameAr : participant.name}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {lang === "ar" ? participant.titleAr : participant.title}
            </p>
            {(participant.bio || participant.bioAr) && (
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                {lang === "ar" ? participant.bioAr : participant.bio}
              </p>
            )}
          </div>
        </div>
        {participant.photo && (
          <div className="absolute left-1/2 top-0 -translate-x-1/2 z-10 h-40 w-40 sm:h-48 sm:w-48 rounded-full overflow-hidden shadow-lg bg-secondary">
            <img
              src={participant.photo}
              alt={participant.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantCard({
  participant,
  onClick,
  lang,
  isArabic,
}: {
  participant: Participant;
  onClick: () => void;
  lang: string;
  isArabic: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-center border border-border rounded-md overflow-hidden bg-card hover:border-accent/40 hover:shadow-md transition-all duration-200 cursor-pointer w-full flex flex-col"
    >
      {/* The grid never shows a photo, even when one exists — it only
          appears in the modal once someone clicks through. Keeps every card
          the same compact height regardless of who has a picture on file. */}
      <div className="px-4 py-4 flex-1">
        <div className="font-serif text-base text-primary leading-tight group-hover:text-accent transition-colors">
          {lang === "ar" ? participant.nameAr : participant.name}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {lang === "ar" ? participant.titleAr : participant.title}
        </div>
        <div className="text-[11px] font-medium text-green-600 mt-1.5 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isArabic ? "اضغط لقراءة المزيد" : "Click to read more"}
        </div>
      </div>
    </button>
  );
}

function ParticipantsPage() {
  const { lang, isArabic } = useLanguage();
  const { participant: deepLinkedId } = Route.useSearch();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selected, setSelected] = useState<Participant | null>(null);

  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: payloadParticipants = [] } = useQuery({
    queryKey: ["participants"],
    queryFn: fetchParticipants,
  });

  // Opens a tagged person's modal when arriving from a photo's "With: ..."
  // tag. Runs once per deep link -- payloadParticipants is a stable
  // reference between renders (React Query), so this doesn't refire just
  // because a visitor closed the modal.
  useEffect(() => {
    if (!deepLinkedId) return;
    const match = payloadParticipants.find((p) => p.id === deepLinkedId);
    if (match) setSelected(mapPayloadParticipant(match));
  }, [deepLinkedId, payloadParticipants]);

  // Always the real CMS data, even when it's empty -- falling back to the
  // hardcoded PARTICIPANTS placeholder list on an empty result meant a fetch
  // that failed for any reason (wrong URL, CORS, the backend being down)
  // silently showed fake people instead of surfacing the problem, which is
  // exactly what made unpublishing someone look like it had no effect.
  const participants: Participant[] = payloadParticipants
    .filter(isVisible)
    .map(mapPayloadParticipant);

  const q = search.toLowerCase();
  const filtered = participants.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(q) || f.nameAr.includes(search);
    return matchesCategory(f.category, activeCategory) && matchesSearch;
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={isArabic ? "عن مبادرة كرامة" : "About the Dignity Initiative"}
        eyebrowColor={SECTION_COLORS.about}
        title={isArabic ? "مجموعة العمل" : "Working Group"}
        description={
          isArabic
            ? "هؤلاء هم الأشخاص الذين أوصلونا إلى ما نحن عليه اليوم.\nباحثون وأكاديميون ومنتسبون يجمعهم الالتزام بخدمة الكرامة الإنسانية."
            : "These are the people who got us to where we are today.\nResearchers, academics, and affiliates united by a commitment to human dignity."
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div
          className={
            "flex flex-col sm:flex-row gap-4 mb-10" + (isArabic ? " sm:flex-row-reverse" : "")
          }
        >
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

          <div className={"relative sm:ml-auto" + (isArabic ? " sm:ml-0 sm:mr-auto" : "")}>
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

        {filtered.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                onClick={() => setSelected(participant)}
                lang={lang}
                isArabic={isArabic}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground text-sm">
            {isArabic ? "لا توجد نتائج." : "No participants found."}
          </div>
        )}
      </div>

      {selected && (
        <ParticipantModal
          participant={selected}
          onClose={() => setSelected(null)}
          isArabic={isArabic}
          lang={lang}
        />
      )}
    </PageLayout>
  );
}
