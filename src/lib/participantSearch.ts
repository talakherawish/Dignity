import type { Participant } from "@/components/ParticipantModal";
import { PARTICIPANT_ROLE_LABEL } from "@/lib/payload";
import { containsAny, fold, foldedMatches } from "@/lib/keywords";

/**
 * The Working Group search: every word typed has to be found somewhere about
 * the person -- their name, their role line, their bio, in either language --
 * or name the kind of member they are. That last part is what lets "interns"
 * or "متدربات" find every intern, whatever their role line says: each role
 * kept in the admin answers to the words people use for it, singular and
 * plural, English and Arabic.
 */

const ROLE_WORDS: Record<Participant["category"], string[]> = {
  researcher: [
    "researcher",
    "researchers",
    "research",
    "باحث",
    "باحثه",
    "باحثون",
    "باحثين",
    "باحثات",
  ],
  visitor: ["visitor", "visitors", "visiting", "زائر", "زائره", "زائرون", "زائرين", "زوار"],
  student: ["student", "students", "طالب", "طالبه", "طلاب", "طلبه", "طالبات"],
  intern: [
    "intern",
    "interns",
    "internship",
    "trainee",
    "trainees",
    "متدرب",
    "متدربه",
    "متدربون",
    "متدربين",
    "متدربات",
  ],
  practical_support: ["support", "practical", "staff", "team", "دعم", "فريق", "العملي"],
  team_member: ["team", "member", "members", "staff", "support", "فريق", "عضو", "اعضاء", "دعم"],
  speaker: ["speaker", "speakers", "متحدث", "متحدثه", "متحدثون", "متحدثين"],
  author: ["author", "authors", "writer", "writers", "مؤلف", "مؤلفه", "مؤلفون", "كاتب", "كتاب"],
};
const FOLDED_ROLE_WORDS = Object.fromEntries(
  Object.entries(ROLE_WORDS).map(([role, words]) => [role, words.map(fold)]),
) as Record<Participant["category"], string[]>;

/** "interns" -> also "intern", so the singular written on the page is found and marked. */
function forms(word: string): string[] {
  const out = [word];
  if (word.length > 4 && word.endsWith("es")) out.push(word.slice(0, -2));
  if (word.length > 3 && word.endsWith("s")) out.push(word.slice(0, -1));
  return out;
}

/** The folded words of a query. */
export function searchWords(query: string): string[] {
  return fold(query).split(/\s+/).filter(Boolean);
}

/** What to mark on the page for these words, singulars included. */
export function searchNeedles(words: string[]): string[] {
  return [...new Set(words.flatMap(forms))];
}

function namesRole(category: Participant["category"], word: string): boolean {
  if (word.length < 3) return false;
  return FOLDED_ROLE_WORDS[category].some(
    (w) => w.startsWith(word) || (w.length >= 4 && word.startsWith(w)),
  );
}

export type ParticipantMatch = {
  /** A stretch of the bio around what was found, when the bio is where it was. */
  bioSnippet?: string;
  /** The role's own name, when that is what matched and the role line doesn't say it. */
  roleLabel?: string;
};

/** Whether the person answers every word, and what to show about why. Null when not. */
export function matchParticipant(
  person: Participant,
  words: string[],
  isArabic: boolean,
): ParticipantMatch | null {
  if (words.length === 0) return {};
  const bios = isArabic ? [person.bioAr, person.bio] : [person.bio, person.bioAr];
  const texts = [person.name, person.nameAr, person.title, person.titleAr, ...bios];
  let byRole = false;
  for (const word of words) {
    const inText = texts.some((text) => text && containsAny(text, forms(word)));
    const inRole = namesRole(person.category, word);
    if (!inText && !inRole) return null;
    if (inRole && !inText) byRole = true;
  }

  const needles = searchNeedles(words);
  const match: ParticipantMatch = {};
  for (const bio of bios) {
    const [first] = bio ? foldedMatches(bio, needles) : [];
    if (bio && first) {
      match.bioSnippet = snippet(bio, first);
      break;
    }
  }
  if (byRole) {
    const label = PARTICIPANT_ROLE_LABEL[person.category];
    match.roleLabel = isArabic ? label.ar : label.en;
  }
  return match;
}

/** About a sentence of the bio around the match, cut at word boundaries. */
function snippet(text: string, [start, end]: [number, number]): string {
  let from = Math.max(0, start - 60);
  let to = Math.min(text.length, end + 90);
  if (from > 0) from = text.indexOf(" ", from) + 1 || from;
  if (to < text.length) to = text.lastIndexOf(" ", to) > end ? text.lastIndexOf(" ", to) : to;
  return (from > 0 ? "… " : "") + text.slice(from, to).trim() + (to < text.length ? " …" : "");
}
