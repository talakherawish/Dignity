import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import type { Language } from "@/contexts/LanguageContext";

/**
 * Which language the site opens in.
 *
 * The language used to be hardcoded to Arabic on every render, so a reader who
 * switched to English was put back into Arabic by the next reload. It is now
 * remembered, and a first-time visitor gets whichever of the two their browser
 * asks for.
 *
 * A cookie rather than localStorage, because the pages are server-rendered:
 * the server writes real translated text into the HTML, so it has to know the
 * language before it renders. Only a cookie travels with the request. Reading
 * it happens through `createIsomorphicFn`, so the server reads the request
 * header and the browser reads `document.cookie` — and the root route's loader
 * resolves it once on the server and hands the result to the client, so
 * hydration can't disagree with what was rendered.
 */

export const LANGUAGE_COOKIE = "lang";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** "ar", "ar-PS" and "AR" all mean Arabic; anything we don't publish in is null. */
function normalise(value: string | undefined | null): Language | null {
  if (!value) return null;
  const tag = value.trim().toLowerCase();
  if (tag === "ar" || tag.startsWith("ar-")) return "ar";
  if (tag === "en" || tag.startsWith("en-")) return "en";
  return null;
}

/**
 * `ar-PS,ar;q=0.9,en-US;q=0.8` → the tags in the order the browser prefers
 * them. Entries without an explicit q rank highest, which is what the spec
 * says they mean.
 */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { tag: tag.trim(), q: quality ? Number.parseFloat(quality.slice(2)) : 1 };
    })
    .filter((entry) => entry.tag !== "" && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}

/** The visitor's first choice among the two languages the site publishes in. */
function firstSupported(tags: string[]): Language | null {
  for (const tag of tags) {
    const match = normalise(tag);
    if (match) return match;
  }
  return null;
}

function readBrowserCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * An explicit choice always wins; otherwise fall back to what the browser asks
 * for, and to English when it asks for neither.
 */
export const resolveInitialLanguage = createIsomorphicFn()
  .server((): Language => {
    const chosen = normalise(getCookie(LANGUAGE_COOKIE));
    if (chosen) return chosen;
    return firstSupported(parseAcceptLanguage(getRequestHeader("accept-language") ?? "")) ?? "en";
  })
  .client((): Language => {
    const chosen = normalise(readBrowserCookie(LANGUAGE_COOKIE));
    if (chosen) return chosen;
    return firstSupported([...navigator.languages]) ?? "en";
  });

/**
 * Remember a choice the reader made. Only a language preference, so `lax` is
 * enough; `secure` is added on https so the deployed site doesn't send it in
 * the clear, but left off locally where dev runs on plain http.
 */
export function persistLanguage(lang: Language): void {
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax${secure}`;
}
