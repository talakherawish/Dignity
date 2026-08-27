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
  category: "researcher" | "visitor" | "student" | "speaker" | "author" | "team_member";
  email: string;
  bio: string;
  bioAr: string;
  photo?: string;
};

const CATEGORIES = [
  { value: "all", en: "All", ar: "الكل" },
  { value: "researcher", en: "Researchers", ar: "باحثون" },
  { value: "visitor", en: "Visitors", ar: "زائرون" },
  { value: "student", en: "Students", ar: "طلاب" },
  { value: "speaker", en: "Speakers", ar: "متحدثون" },
  { value: "author", en: "Authors", ar: "مؤلفون" },
  { value: "team_member", en: "Team Members", ar: "أعضاء الفريق" },
];

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
  const hasPhoto = Boolean(participant.photo);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* The avatar is half outside the card, so the wrapper's top padding is
          half the avatar's height and the card's own top padding clears the
          overlapping half. Both follow from the h-56 below — keep them in step
          if the avatar is resized. No photo means no avatar at all (rather
          than an empty placeholder circle), so both paddings collapse. */}
      <div className="relative w-full max-w-md" style={{ paddingTop: hasPhoto ? "112px" : "0px" }}>
        {hasPhoto && (
          <div className="absolute left-1/2 top-0 -translate-x-1/2 z-10">
            <div className="h-56 w-56 rounded-full overflow-hidden shadow-2xl bg-secondary flex items-center justify-center">
              <img
                src={participant.photo}
                alt={participant.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
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
          <div className="px-8 pb-8" style={{ paddingTop: hasPhoto ? "116px" : "48px" }}>
            <h2 className="font-serif text-2xl text-primary text-center">
              {lang === "ar" ? participant.nameAr : participant.name}
            </h2>
            <p className="text-muted-foreground text-sm text-center mt-1">
              {lang === "ar" ? participant.titleAr : participant.title}
            </p>
            {participant.email && (
              <a
                href={"mailto:" + participant.email}
                className="mt-4 flex items-center justify-center gap-2 bg-secondary border border-border text-foreground/70 text-sm px-4 py-2.5 rounded-full hover:text-foreground hover:border-foreground/30 transition-colors w-fit mx-auto"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {participant.email}
              </a>
            )}
            {(participant.bio || participant.bioAr) && (
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                {lang === "ar" ? participant.bioAr : participant.bio}
              </p>
            )}
          </div>
        </div>
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
  const participants: Participant[] = payloadParticipants.map(mapPayloadParticipant);

  const q = search.toLowerCase();
  const filtered = participants.filter((f) => {
    const matchesCategory = activeCategory === "all" || f.category === activeCategory;
    const matchesSearch = f.name.toLowerCase().includes(q) || f.nameAr.includes(search);
    return matchesCategory && matchesSearch;
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={isArabic ? "عن مبادرة كرامة" : "About the Dignity Initiative"}
        eyebrowColor={SECTION_COLORS.about}
        title={isArabic ? "المشاركون" : "Participants"}
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
