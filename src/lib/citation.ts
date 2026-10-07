import type { PayloadBibliographyEntry, PayloadReading } from "@/lib/payload";

/**
 * Citations in Chicago bibliography style (17th ed., notes-and-bibliography),
 * shown on the page and copied to the clipboard from the same parts, so what
 * a reader sees is exactly what they paste:
 *
 *   Bonefeld, Werner, and Kosmas Psychopedis, eds. *Human Dignity: Social
 *       Autonomy and the Critique of Capitalism*. Abingdon: Routledge, 2017.
 *
 * Written in the source's own language, not the reader's -- an Arabic book is
 * cited in Arabic on the English page too, the same way its title is never
 * translated -- so the connecting words ("edited by", "no.") and the commas
 * follow the entry.
 *
 * Names are stored as written ("Werner Bonefeld"); Chicago wants the first
 * one inverted. See `invert` for the rules, and for what it leaves alone.
 */

/** One run of a citation; italic runs are the titles of whole works. */
export type Segment = { text: string; italic?: boolean };

/** What a citation is built from -- a bibliography entry or a reading. */
export type CitationSource = {
  kind: "book" | "chapter" | "article" | "report" | "thesis" | "website";
  arabic: boolean;
  title: string;
  authors: string[];
  editors: string[];
  translator?: string;
  /** The book a chapter is in, or the journal or website an article is in. */
  container?: string;
  year?: string;
  publisher?: string;
  city?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  edition?: string;
  reportType?: string;
  url?: string;
  doi?: string;
};

type Words = {
  and: string;
  comma: string;
  ed: string;
  eds: string;
  editedBy: string;
  translatedBy: string;
  in: string;
  no: string;
  edition: (value: string) => string;
  noDate: string;
  thesis: string;
};

const WORDS: Record<"en" | "ar", Words> = {
  en: {
    and: "and ",
    comma: ", ",
    ed: "ed.",
    eds: "eds.",
    editedBy: "Edited by ",
    translatedBy: "Translated by ",
    in: "In ",
    no: "no. ",
    edition: (value) => (/ed\.?$/i.test(value) ? value : `${value} ed.`),
    noDate: "n.d.",
    thesis: "Thesis",
  },
  ar: {
    and: "و",
    comma: "، ",
    ed: "(محرر)",
    eds: "(محررون)",
    editedBy: "تحرير ",
    translatedBy: "ترجمة ",
    in: "في ",
    no: "عدد ",
    edition: (value) => `ط. ${value}`,
    noDate: "د.ت.",
    thesis: "رسالة جامعية",
  },
};

/** Words that make a name an organisation's, which Chicago never inverts. */
const ORGANISATION =
  /\b(commission|council|committee|organi[sz]ation|institute|university|bank|nations|cent(er|re)|association|ministry|office|agency|foundation|forum|society|union|network|group|programme|program|authority|court|parliament)\b|\(/i;

/** The same, for organisations named in Arabic. */
const ORGANISATION_AR =
  /(^|\s)(مركز|مؤسسة|جمعية|وزارة|معهد|جامعة|منظمة|اتحاد|هيئة|دائرة|سلطة|الجهاز|شبكة|مجلس|لجنة|برنامج|الاتحاد|المركز|المؤسسة|الهيئة)(\s|$)/;

/** Lowercase particles that travel with the surname: "de Greiff, Pablo". */
const PARTICLES = new Set([
  "de",
  "del",
  "della",
  "da",
  "di",
  "van",
  "von",
  "der",
  "den",
  "la",
  "le",
  "du",
]);

/** Arabic name parts that can't stand alone at the front of a surname. */
const ARABIC_COMPOUND = new Set(["أبو", "ابو", "عبد", "بن", "ابن", "آل", "أم", "ام"]);

/**
 * "Werner Bonefeld" -> "Bonefeld, Werner". The surname is the last word,
 * together with any particle before it ("de Greiff") or, in Arabic, a
 * compound start ("أبو دية"). An organisation, a one-word name, or a name
 * already written surname-first (it has a comma) is returned as it is.
 */
export function invert(name: string, arabic: boolean): string {
  const trimmed = name.trim();
  if (
    trimmed.includes(",") ||
    trimmed.includes("،") ||
    ORGANISATION.test(trimmed) ||
    ORGANISATION_AR.test(trimmed)
  )
    return trimmed;
  const words = trimmed.split(/\s+/);
  if (words.length < 2) return trimmed;
  let start = words.length - 1;
  while (start > 1 && (PARTICLES.has(words[start - 1]) || ARABIC_COMPOUND.has(words[start - 1]))) {
    start--;
  }
  const surname = words.slice(start).join(" ");
  const given = words.slice(0, start).join(" ");
  return `${surname}${arabic ? "، " : ", "}${given}`;
}

/** "A", "A and B", "A, B, and C" -- the first inverted, the rest as written. */
function names(list: string[], words: Words, invertFirst: boolean, arabic: boolean): string {
  const shown = list.map((name, i) =>
    i === 0 && invertFirst ? invert(name, arabic) : name.trim(),
  );
  if (shown.length === 1) return shown[0];
  if (arabic)
    return shown.slice(0, -1).join(words.comma) + " " + words.and + shown[shown.length - 1];
  // "Bonefeld, Werner, and Kosmas Psychopedis": the comma closes the
  // inverted name. Two names as written take none: "Becchi and Mathis".
  if (shown.length === 2) return `${shown[0]}${invertFirst ? "," : ""} and ${shown[1]}`;
  return `${shown.slice(0, -1).join(", ")}, and ${shown[shown.length - 1]}`;
}

/** Ends a run with a full stop, unless it already ends in one (or ? or !). */
const stop = (text: string) => (/[.?!؟]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

/** “Title.” -- Chicago puts the closing full stop inside the quotation marks. */
const quoted = (title: string) => `“${stop(title)}”`;

/** "City: Publisher, Year." with whichever parts there are. */
function facts(source: CitationSource, words: Words): string {
  const year = source.year || words.noDate;
  // Chicago gives the first place only: "Abingdon", not "Abingdon; New York".
  const place = [source.city?.split(";")[0].trim(), source.publisher].filter(Boolean).join(": ");
  return stop(place ? `${place}${words.comma}${year}` : year);
}

const link = (source: CitationSource) =>
  source.doi
    ? `https://doi.org/${source.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}`
    : source.url;

export function chicago(source: CitationSource): Segment[] {
  // Page ranges take an en dash: 451–477.
  if (source.pages) {
    source = { ...source, pages: source.pages.trim().replace(/(\d)\s*[-‐‑—]\s*(\d)/g, "$1–$2") };
  }
  const words = WORDS[source.arabic ? "ar" : "en"];
  const out: Segment[] = [];
  const add = (text: string, italic = false) => out.push({ text, italic });

  // Who: the authors, or -- for an edited volume cited as a whole -- its
  // editors, marked as such. Zotero exports often list a volume's editors as
  // its authors too; that is still an edited volume, not one authored twice.
  const sameAsEditors =
    source.editors.length > 0 &&
    source.authors.length === source.editors.length &&
    source.authors.every((a, i) => a.trim() === source.editors[i].trim());
  const editorsLead =
    (source.authors.length === 0 || (sameAsEditors && source.kind !== "chapter")) &&
    source.editors.length > 0;
  if (editorsLead) source = { ...source, authors: [] };
  if (source.authors.length) {
    add(`${stop(names(source.authors, words, true, source.arabic))} `);
  } else if (editorsLead) {
    const who = names(source.editors, words, true, source.arabic);
    add(`${who}${source.arabic ? " " : ", "}${source.editors.length > 1 ? words.eds : words.ed} `);
  }

  const editedBy = (lead: string) =>
    source.editors.length && !editorsLead
      ? `${lead}${names(source.editors, words, false, source.arabic)}`
      : "";
  const translatedBy = source.translator ? `${words.translatedBy}${source.translator}` : "";

  switch (source.kind) {
    case "chapter": {
      add(`${quoted(source.title)} `);
      if (source.container) {
        add(words.in);
        add(source.container, true);
        const after = [editedBy(source.arabic ? "تحرير " : "edited by "), source.pages].filter(
          Boolean,
        );
        add(`${after.length ? words.comma + after.join(words.comma) : ""}. `);
      }
      add(facts(source, words));
      break;
    }
    case "article": {
      add(`${quoted(source.title)} `);
      if (source.container) {
        add(source.container, true);
        const year = source.year ? ` (${source.year})` : "";
        if (source.volume || source.issue) {
          const volume = source.volume ? ` ${source.volume}` : "";
          const issue = source.issue
            ? `${source.volume ? "," : ""} ${words.no}${source.issue}`
            : "";
          add(`${volume}${issue}${year}${source.pages ? `: ${source.pages}` : ""}.`);
        } else {
          add(
            `${words.comma}${source.year || words.noDate}${source.pages ? words.comma + source.pages : ""}.`,
          );
        }
      } else {
        add(stop(source.year || words.noDate));
      }
      break;
    }
    case "website": {
      add(`${quoted(source.title)} `);
      if (source.container) add(`${stop(source.container)} `);
      add(stop(source.year || words.noDate));
      break;
    }
    case "thesis": {
      add(`${quoted(source.title)} `);
      add(
        stop(
          [words.thesis, source.publisher, source.year || words.noDate]
            .filter(Boolean)
            .join(words.comma),
        ),
      );
      break;
    }
    default: {
      // A book or report: a whole work, so its own title is italic.
      // The full stop after an italic title is roman -- *Title*. -- unless the
      // title ends in its own ? or !, which stays inside the italics.
      add(source.title.trim(), true);
      add(/[?!؟]$/.test(source.title.trim()) ? " " : ". ");
      for (const part of [
        editedBy(words.editedBy),
        translatedBy,
        source.edition && words.edition(source.edition),
        source.reportType,
      ]) {
        if (part) add(`${stop(part)} `);
      }
      add(facts(source, words));
    }
  }

  // Online sources end with where to find them. Books and chapters don't:
  // their links are mostly a shop's or a publisher's page, not the text.
  const url = link(source);
  if (url && (source.doi || !["book", "chapter"].includes(source.kind))) add(` ${url}.`);

  return out;
}

const KIND: Record<PayloadBibliographyEntry["entryType"], CitationSource["kind"]> = {
  book: "book",
  bookChapter: "chapter",
  journalArticle: "article",
  otherArticle: "article",
  report: "report",
  thesis: "thesis",
  website: "website",
  other: "book",
};

export const entrySource = (entry: PayloadBibliographyEntry): CitationSource => ({
  kind: KIND[entry.entryType] ?? "book",
  arabic: entry.language === "ar",
  title: entry.title,
  authors: (entry.authors ?? []).map((a) => a.name),
  editors: (entry.editors ?? []).map((e) => e.name),
  container: entry.containerTitle,
  year: entry.year,
  publisher: entry.publisher,
  city: entry.city,
  volume: entry.volume,
  issue: entry.issue,
  pages: entry.pages,
  edition: entry.edition,
  reportType: entry.reportType,
  url: entry.url,
  doi: entry.doi,
});

/** A reading's text, cited as a book from its source (e.g. Project Gutenberg). */
export const readingSource = (reading: PayloadReading): CitationSource => ({
  kind: "book",
  arabic: reading.language === "ar",
  title: reading.language === "ar" ? (reading.titleAr ?? reading.title) : reading.title,
  authors: (reading.authors ?? []).map((a) => a.name),
  editors: [],
  translator: reading.translator,
  year: reading.year,
  publisher: reading.sourceName,
  url: reading.link,
});

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Puts a citation (and its annotation, when given) on the clipboard twice
 * over: as formatted HTML -- italics, and Chicago's half-inch hanging indent
 * -- for pasting into Word or Google Docs, and as plain text for everywhere
 * else. An annotation follows its citation as an indented paragraph, the
 * usual layout of an annotated bibliography.
 */
export async function copyCitation(
  segments: Segment[],
  { annotation, arabic }: { annotation?: string; arabic: boolean },
): Promise<void> {
  const plain = segments.map((s) => s.text).join("") + (annotation ? `\n\n${annotation}` : "");
  const dir = arabic ? ' dir="rtl" lang="ar"' : "";
  const title = arabic ? "b" : "i";
  const html =
    `<p${dir} style="margin:0 0 0.5em 0;padding-inline-start:0.5in;text-indent:-0.5in">` +
    segments
      .map((s) => (s.italic ? `<${title}>${escape(s.text)}</${title}>` : escape(s.text)))
      .join("") +
    "</p>" +
    (annotation
      ? annotation
          .split(/\n\s*\n/)
          .map(
            (p) =>
              `<p${dir} style="margin:0 0 0.5em 0;padding-inline-start:0.5in">${escape(p.trim())}</p>`,
          )
          .join("")
      : "");

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      // Some browsers refuse rich clipboard writes; plain text still works.
    }
  }
  await navigator.clipboard.writeText(plain);
}

/** The first author's surname (or the title), for sorting alphabetically. */
export function sortName(source: CitationSource): string {
  const lead = source.authors[0] ?? source.editors[0];
  return (lead ? invert(lead, source.arabic) : source.title).replace(/^[“"«]/, "").trim();
}
