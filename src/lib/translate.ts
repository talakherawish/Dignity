/**
 * Machine translation for text the team wrote in one language only, asked
 * for by the reader and made in their browser through MyMemory
 * (mymemory.translated.net) -- free, keyless, and limited to about 500 bytes
 * a request, so longer text goes paragraph by paragraph, sentence by
 * sentence. Shown marked as a machine's, never as the team's own words: see
 * MachineTranslation.
 */

type Language = "en" | "ar";

const LIMIT = 450;
const bytes = (text: string) => new TextEncoder().encode(text).length;
const done = new Map<string, Promise<string>>();

/** The text in pieces small enough to send, each ending where a sentence does. */
function pieces(paragraph: string): string[] {
  const sentences = paragraph.match(/[^.!?؟]+[.!?؟]*\s*/g) ?? [paragraph];
  const out: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && bytes(current + sentence) > LIMIT) {
      out.push(current);
      current = "";
    }
    // A sentence too long by itself goes word by word.
    if (bytes(sentence) > LIMIT) {
      for (const word of sentence.split(/(?<=\s)/)) {
        if (current && bytes(current + word) > LIMIT) {
          out.push(current);
          current = "";
        }
        current += word;
      }
    } else {
      current += sentence;
    }
  }
  if (current.trim()) out.push(current);
  return out;
}

async function translatePiece(text: string, from: Language, to: Language): Promise<string> {
  const params = new URLSearchParams({ q: text.trim(), langpair: `${from}|${to}` });
  const res = await fetch(`https://api.mymemory.translated.net/get?${params}`);
  const data = (await res.json()) as {
    responseStatus?: number | string;
    quotaFinished?: boolean;
    responseData?: { translatedText?: string };
  };
  const translated = data.responseData?.translatedText;
  if (!res.ok || Number(data.responseStatus) !== 200 || data.quotaFinished || !translated) {
    throw new Error("Translation unavailable");
  }
  return translated;
}

export function translate(text: string, from: Language, to: Language): Promise<string> {
  const key = `${from}|${to}|${text}`;
  let result = done.get(key);
  if (!result) {
    result = (async () => {
      const paragraphs: string[] = [];
      for (const paragraph of text.split(/\n\s*\n/)) {
        const parts: string[] = [];
        for (const piece of pieces(paragraph)) parts.push(await translatePiece(piece, from, to));
        paragraphs.push(parts.join(" "));
      }
      return paragraphs.join("\n\n");
    })();
    // A failure isn't kept, so the reader can try again.
    result.catch(() => done.delete(key));
    done.set(key, result);
  }
  return result;
}
