import type { ReactNode } from "react";
import type { PayloadBibliographyEntry } from "@/lib/payload";

/**
 * A bibliography entry as one author–date citation, the way Muwatin's
 * databases print theirs:
 *
 *   Werner Bonefeld and Kosmas Psychopedis. 2017. *Human Dignity: ...*.
 *   Abingdon; New York: Routledge.
 *
 * Names are printed as entered rather than inverted to "Surname, First":
 * entries mix Arabic and Latin names, single-word institutional authors and
 * names with particles, and no rule turns all of those around correctly.
 *
 * Written in the source's own language, not the reader's -- an Arabic book is
 * cited in Arabic on the English page too, the same way its title is never
 * translated -- so the connecting words ("edited by", "n.d.") follow the entry.
 */

type Words = {
  and: string;
  noDate: string;
  editedBy: string;
  in: string;
  edition: string;
  list: string;
};

const WORDS: Record<"en" | "ar", Words> = {
  en: {
    and: " and ",
    noDate: "n.d.",
    editedBy: "edited by ",
    in: "In ",
    edition: " ed.",
    list: ", ",
  },
  ar: { and: " و", noDate: "د.ت.", editedBy: "تحرير ", in: "في ", edition: "، طبعة", list: "، " },
};

function joinNames(names: string[], words: Words): string {
  if (names.length <= 1) return names[0] ?? "";
  return names.slice(0, -1).join(words.list) + words.and + names[names.length - 1];
}

/** "Text." -- without doubling a full stop or question mark the text already ends in. */
const closed = (text: string) => (/[.?!؟]$/.test(text) ? text : `${text}.`);

export function Citation({ entry }: { entry: PayloadBibliographyEntry }) {
  const arabic = entry.language === "ar";
  const words = WORDS[arabic ? "ar" : "en"];
  // Arabic has no italic; a browser's slanted Arabic reads as broken, so
  // Arabic citations set titles in bold, as Arabic bibliographies do.
  const work = arabic ? "font-semibold not-italic" : "italic";
  const authors = joinNames(
    (entry.authors ?? []).map((a) => a.name),
    words,
  );
  const editors = joinNames(
    (entry.editors ?? []).map((e) => e.name),
    words,
  );
  const place = [entry.city, entry.publisher].filter(Boolean).join(": ");

  // A book or report is a work in itself, so its own title is set off; a
  // chapter, article or web page is part of one, so its title is quoted and the
  // work it sits in is set off instead.
  const standalone =
    entry.entryType === "book" || entry.entryType === "report" || entry.entryType === "thesis";
  const parts: ReactNode[] = [];

  if (authors) parts.push(`${closed(authors)} `);
  parts.push(`${entry.year || words.noDate}. `);

  if (standalone) {
    parts.push(
      <cite key="title" className={work}>
        {closed(entry.title)}
      </cite>,
      " ",
    );
    if (entry.edition) parts.push(`${closed(entry.edition + words.edition)} `);
    if (entry.reportType) parts.push(`${closed(entry.reportType)} `);
    if (editors && editors !== authors) parts.push(`${closed(words.editedBy + editors)} `);
  } else {
    parts.push(`“${closed(entry.title)}” `);
    if (entry.containerTitle) {
      const isJournal = entry.entryType === "journalArticle" || entry.entryType === "otherArticle";
      if (isJournal) {
        parts.push(
          <cite key="container" className={work}>
            {entry.containerTitle}
          </cite>,
        );
        if (entry.volume) parts.push(` ${entry.volume}`);
        if (entry.issue) parts.push(` (${entry.issue})`);
        parts.push(entry.pages ? `: ${entry.pages}. ` : ". ");
      } else {
        parts.push(
          words.in,
          <cite key="container" className={work}>
            {entry.containerTitle}
          </cite>,
        );
        if (editors) parts.push(`${words.list}${words.editedBy}${editors}`);
        parts.push(entry.pages ? `${words.list}${entry.pages}. ` : ". ");
      }
    }
  }

  if (place) parts.push(closed(place));

  return <>{parts}</>;
}

/** The first author's name, for sorting a list alphabetically. */
export const sortName = (entry: PayloadBibliographyEntry) =>
  (entry.authors?.[0]?.name ?? entry.title).trim();
