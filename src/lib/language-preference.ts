import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import type { Language } from "@/contexts/LanguageContext";

/**
 * Which language the site opens in.
 *
 * The language used to be hardcoded to Arabic on every render, so a reader who
 * switched to English was put back into Arabic by the next reload. It is now
 * remembered: a first-time visitor (no cookie yet) gets Arabic, and anyone who
 * has picked a language before gets that choice back.
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

const DEFAULT_LANGUAGE: Language = "ar";

/** "ar", "ar-PS" and "AR" all mean Arabic; anything we don't publish in is null. */
function normalise(value: string | undefined | null): Language | null {
  if (!value) return null;
  const tag = value.trim().toLowerCase();
  if (tag === "ar" || tag.startsWith("ar-")) return "ar";
  if (tag === "en" || tag.startsWith("en-")) return "en";
  return null;
}

function readBrowserCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * A saved choice always wins; a first-time visitor with no cookie yet gets
 * Arabic, regardless of what their browser's language settings say.
 */
export const resolveInitialLanguage = createIsomorphicFn()
  .server((): Language => {
    return normalise(getCookie(LANGUAGE_COOKIE)) ?? DEFAULT_LANGUAGE;
  })
  .client((): Language => {
    return normalise(readBrowserCookie(LANGUAGE_COOKIE)) ?? DEFAULT_LANGUAGE;
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
