import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Highlighted } from "@/components/Highlighted";
import { useLanguage } from "@/contexts/LanguageContext";
import { mediaSrcSet, mediaUrl, roleLabel, type PayloadParticipant } from "@/lib/payload";
import { ProfileLinks, type ProfileLink } from "@/components/ProfileLinks";
import { FormattedText } from "./RichText";
import { participantsQuery } from "@/lib/queries";

/**
 * A person's profile card, shown over whatever page opened it -- the Working
 * Group page, the homepage's team row, a photo's tags, a publication's
 * authors, a forum's participants -- and closed back onto that same page,
 * where the reader was.
 */

export type Participant = {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  titleRich?: unknown;
  titleRichAr?: unknown;
  category: string;
  email: string;
  links: ProfileLink[];
  bio: string;
  bioAr: string;
  photo?: string;
  photoSrcSet?: string;
  /** Their full page's address, when they have one -- see FullPageLink. */
  pageSlug?: string;
};

export function mapPayloadParticipant(p: PayloadParticipant): Participant {
  const role = roleLabel(p.category);
  return {
    id: p.id,
    name: p.name,
    nameAr: p.nameAr ?? p.name,
    title: p.title ?? role.en,
    titleAr: p.titleAr ?? p.title ?? role.ar,
    // Formatting goes with whichever plain role is shown; the built-in role
    // label has none.
    titleRich: p.title ? p.titleRich : undefined,
    titleRichAr: p.titleAr ? p.titleRichAr : p.title ? p.titleRich : undefined,
    category: p.category,
    email: p.email ?? "",
    links: p.links ?? [],
    bio: p.bio ?? "",
    bioAr: p.bioAr ?? p.bio ?? "",
    photo: mediaUrl(p.photo) || undefined,
    photoSrcSet: mediaSrcSet(p.photo),
    pageSlug: p.hasFullPage && p.slug ? p.slug : undefined,
  };
}

/** The pop-up's way to the person's own page, for those who have one. */
function FullPageLink({ slug, isArabic }: { slug?: string; isArabic: boolean }) {
  if (!slug) return null;
  return (
    <Link
      to="/about/participants/$slug"
      params={{ slug }}
      className="inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full border border-border bg-card px-3 text-xs font-medium text-primary transition-colors hover:border-accent hover:text-accent"
    >
      {isArabic ? "الصفحة الكاملة" : "View full page"}
      <span aria-hidden>{isArabic ? "←" : "→"}</span>
    </Link>
  );
}

export function ParticipantModal({
  participant,
  onClose,
  needles = [],
}: {
  participant: Participant;
  onClose: () => void;
  /** Search words to mark in the name, role and bio -- see the Working Group search. */
  needles?: string[];
}) {
  const { lang, isArabic } = useLanguage();
  const isAr = lang === "ar";
  const name = isAr ? participant.nameAr : participant.name;
  const role = isAr ? participant.titleAr : participant.title;
  const bio = isAr ? participant.bioAr : participant.bio;
  const hasLinks = !!participant.email || participant.links.length > 0;

  // Portaled to <body>: a pop-up opened from inside a card or a section that
  // has a CSS transform (a hover scale, <Reveal>'s slide-in) would otherwise
  // be positioned against that element instead of the screen. Only ever
  // mounted after a click, so `document` always exists here.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // React passes a portal's clicks up to whatever rendered it -- a card
        // that opens or toggles on click -- so they stop here.
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* The avatar overlaps the card: its vertical center sits on the
          card's top edge, half poking up above it. The spacer above the card
          reserves that top half; the card's pt-24/sm:pt-28 leaves the same
          clearance inside. Capped at 90svh so only the card scrolls -- svh
          rather than vh, which on a phone runs down behind the toolbar. */}
      <div className="relative w-full max-w-3xl max-h-[90svh] flex flex-col">
        {participant.photo && <div className="h-20 sm:h-24 shrink-0" aria-hidden />}
        <div
          className="relative flex-1 min-h-0 bg-card border border-border rounded-lg shadow-2xl overflow-y-auto overscroll-contain"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {/* Same sides in both languages: the links, one above the other,
              with the full page beside them on the left; close on the right. */}
          <div
            dir="ltr"
            className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4"
          >
            <div className="flex items-start gap-2">
              <ProfileLinks links={participant.links} email={participant.email} stacked />
              <FullPageLink slug={participant.pageSlug} isArabic={isArabic} />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label={isArabic ? "إغلاق" : "Close"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div
            className={
              "flex flex-col items-center pb-8 text-center " +
              (hasLinks || participant.pageSlug ? "px-12 sm:px-14 " : "px-8 ") +
              (participant.photo ? "pt-24 sm:pt-28" : "pt-14")
            }
          >
            <h2 className="font-serif text-2xl text-primary">
              <Highlighted text={name} needles={needles} />
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {needles.length > 0 ? (
                <Highlighted text={role} needles={needles} />
              ) : (
                <FormattedText
                  rich={isAr ? participant.titleRichAr : participant.titleRich}
                  text={role}
                />
              )}
            </p>
            {bio && (
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                <Highlighted text={bio} needles={needles} />
              </p>
            )}
          </div>
        </div>
        {participant.photo && (
          <div className="absolute left-1/2 top-0 -translate-x-1/2 z-10 h-40 w-40 sm:h-48 sm:w-48 rounded-full overflow-hidden shadow-lg bg-secondary">
            <img
              src={participant.photo}
              srcSet={participant.photoSrcSet}
              sizes="192px"
              alt={participant.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * A person's name that opens their pop-up right where it is -- on a
 * publication card, in a forum's list of participants -- so closing it leaves
 * the reader on the same page, scrolled where they were. The person is looked
 * up in the full Participants list (cached once fetched), so someone kept off
 * the Working Group page opens just the same.
 */
export function ParticipantLink({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [person, setPerson] = useState<Participant | null>(null);

  const open = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const everyone = await queryClient.fetchQuery(participantsQuery);
    const match = everyone.find((p) => p.id === id);
    if (match) setPerson(mapPayloadParticipant(match));
  };

  return (
    <>
      <button type="button" onClick={open} className={className}>
        {children}
      </button>
      {person && <ParticipantModal participant={person} onClose={() => setPerson(null)} />}
    </>
  );
}
