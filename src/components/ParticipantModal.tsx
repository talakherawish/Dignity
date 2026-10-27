import { Link } from "@tanstack/react-router";
import { X, Mail } from "lucide-react";
import {
  mediaSrcSet,
  mediaUrl,
  PARTICIPANT_ROLE_LABEL,
  type PayloadParticipant,
} from "@/lib/payload";
import { ProfileLinks, type ProfileLink } from "@/components/ProfileLinks";
import { FormattedText } from "./RichText";

/**
 * A person's profile card, shown over whatever page opened it: the Working
 * Group page, and a photo's tags in the photo viewer.
 */

export type Participant = {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  titleRich?: unknown;
  titleRichAr?: unknown;
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
  links: ProfileLink[];
  bio: string;
  bioAr: string;
  photo?: string;
  photoSrcSet?: string;
  /** Their full page's address, when they have one -- see FullPageLink. */
  pageSlug?: string;
};

export function mapPayloadParticipant(p: PayloadParticipant): Participant {
  const role = PARTICIPANT_ROLE_LABEL[p.category];
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
export function FullPageLink({ slug, isArabic }: { slug?: string; isArabic: boolean }) {
  if (!slug) return null;
  return (
    <Link
      to="/about/participants/$slug"
      params={{ slug }}
      className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-accent hover:text-accent"
    >
      {isArabic ? "الصفحة الكاملة" : "View full page"}
      <span aria-hidden>{isArabic ? "←" : "→"}</span>
    </Link>
  );
}

export function ParticipantModal({
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
            <ProfileLinks links={participant.links} />
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
              <FormattedText
                rich={lang === "ar" ? participant.titleRichAr : participant.titleRich}
                text={lang === "ar" ? participant.titleAr : participant.title}
              />
            </p>
            {(participant.bio || participant.bioAr) && (
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                {lang === "ar" ? participant.bioAr : participant.bio}
              </p>
            )}
            <FullPageLink slug={participant.pageSlug} isArabic={isArabic} />
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
    </div>
  );
}
