import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { baseRole, type PayloadParticipant } from "@/lib/payload";
import {
  mapPayloadParticipant,
  ParticipantModal,
  type Participant,
} from "@/components/ParticipantModal";
import { SECTION_COLORS } from "@/lib/sectionColors";
import { participantsQuery } from "@/lib/queries";
import { FormattedText } from "@/components/RichText";
import { Highlighted } from "@/components/Highlighted";
import {
  matchParticipant,
  searchNeedles,
  searchWords,
  type ParticipantMatch,
} from "@/lib/participantSearch";

/** ?participant=<id> deep-links to one profile, opening that person's
 * modal once the list has loaded. */
type ParticipantsSearch = { participant?: string };

export const Route = createFileRoute("/about/participants")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(participantsQuery);
  },
  validateSearch: (search: Record<string, unknown>): ParticipantsSearch => ({
    participant: typeof search.participant === "string" ? search.participant : undefined,
  }),
  component: ParticipantsPage,
});

/**
 * Who this page lists.
 *
 * Two switches, each with its own history. "Keep off the Working Group page"
 * applies to anyone, whatever their role, and is checked by default for every
 * person added from now on -- including anyone added from inside a Forum, who
 * is saved and shown on that forum but has no business appearing here until
 * someone says so. The people who were already in the collection have no value
 * stored for it, which reads as false, so they go on showing as before.
 *
 * The older switch covers Authors and Speakers only, who were hidden here from
 * the start: they're reachable from the publications and photos that credit
 * them rather than from browsing this page.
 */
function isVisible(p: PayloadParticipant): boolean {
  if (p.hideFromWorkingGroupPage === true) return false;
  if (baseRole(p.category) === "author" || baseRole(p.category) === "speaker") {
    return p.showOnWorkingGroupPage === true;
  }
  return true;
}

function ParticipantCard({
  participant,
  onClick,
  needles,
  match,
}: {
  participant: Participant;
  onClick: () => void;
  needles: string[];
  match: ParticipantMatch;
}) {
  const { lang, isArabic } = useLanguage();
  const isAr = lang === "ar";
  const role = isAr ? participant.titleAr : participant.title;
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
          <Highlighted text={isAr ? participant.nameAr : participant.name} needles={needles} />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {needles.length > 0 ? (
            <Highlighted text={role} needles={needles} />
          ) : (
            <FormattedText
              rich={isAr ? participant.titleRichAr : participant.titleRich}
              text={role}
            />
          )}
          {match.roleLabel && (
            <>
              {" · "}
              <mark className="search-mark rounded-sm">{match.roleLabel}</mark>
            </>
          )}
        </div>
        {/* Why a bio search found them: the words around the match. */}
        {match.bioSnippet && (
          <p
            className="mt-2 text-[11px] leading-relaxed text-muted-foreground/90 text-start"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <Highlighted text={match.bioSnippet} needles={needles} />
          </p>
        )}
        <div className="text-[11px] font-medium text-green-600 mt-1.5 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isArabic ? "اضغط لقراءة المزيد" : "Click to read more"}
        </div>
      </div>
    </button>
  );
}

function ParticipantsPage() {
  const { isArabic } = useLanguage();
  const { participant: deepLinkedId } = Route.useSearch();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Participant | null>(null);

  const { data: payloadParticipants = [] } = useQuery(participantsQuery);

  // Opens a tagged person's modal when arriving from a photo's "With: ..."
  // tag. Runs once per deep link -- payloadParticipants is a stable
  // reference between renders (React Query), so this doesn't refire just
  // because a visitor closed the modal.
  useEffect(() => {
    if (!deepLinkedId) return;
    const match = payloadParticipants.find((p) => p.id === deepLinkedId);
    if (match) setSelected(mapPayloadParticipant(match));
  }, [deepLinkedId, payloadParticipants]);

  // Everyone in one group, in the order editors drag them into in the admin
  // (fetchParticipants). Roles stay in the admin for editors' own use; the page
  // no longer filters by them.
  //
  // Always the real CMS data, even when it's empty -- falling back to the
  // hardcoded PARTICIPANTS placeholder list on an empty result meant a fetch
  // that failed for any reason (wrong URL, CORS, the backend being down)
  // silently showed fake people instead of surfacing the problem, which is
  // exactly what made unpublishing someone look like it had no effect.
  const participants: Participant[] = payloadParticipants
    .filter(isVisible)
    .map(mapPayloadParticipant);

  // See participantSearch: names, roles, bios and the kind of member, in
  // both languages, every word typed.
  const words = searchWords(search);
  const needles = searchNeedles(words);
  const filtered = participants.flatMap((participant) => {
    const match = matchParticipant(participant, words, isArabic);
    return match ? [{ participant, match }] : [];
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
        {/* Centred in both languages. */}
        <div className="mb-10 flex justify-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isArabic ? "ابحث بالاسم أو الدور أو السيرة..." : "Search by name, role or bio..."
              }
              className="ps-9 pe-4 py-2 text-sm border border-border rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent w-full transition-colors"
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map(({ participant, match }) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                onClick={() => setSelected(participant)}
                needles={needles}
                match={match}
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
          needles={needles}
        />
      )}
    </PageLayout>
  );
}
