import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Stands in for a body that exists in the other language only.
 *
 * Entries are written by whoever ran the event, and not every one of them
 * arrives in both languages. The pages used to paper over that by falling back
 * to whichever language was filled in, so an Arabic reader could open an entry
 * and be handed a page of English without explanation. Saying so plainly is
 * more honest, and it distinguishes "not translated yet" from "nothing written
 * here", which the silent fallback made indistinguishable.
 *
 * The wording lives in Site Settings under Small UI Labels, so it can be
 * softened without a deploy.
 */
export function TranslationNotice({
  className = "",
  compact = false,
}: {
  className?: string;
  /**
   * Drops the padded, bordered block in favour of a bare line of text, for
   * tight spaces (a publication card's action row, an information list row)
   * where the full block reads as heavier than the content it stands in for.
   */
  compact?: boolean;
}) {
  const { t, isArabic } = useLanguage();

  if (compact) {
    return (
      <p
        className={
          "text-xs leading-relaxed text-muted-foreground " + (isArabic ? "" : "italic ") + className
        }
      >
        {t("content.untranslated")}
      </p>
    );
  }

  return (
    <p
      className={
        "rounded-e-sm border-s-2 border-[color:var(--brand-magenta)]/40 bg-secondary/30 px-4 py-3 font-serif text-sm leading-relaxed text-muted-foreground " +
        // Arabic has no true italic form -- see containsArabic in lib/text --
        // and this notice itself renders in Arabic for an Arabic reader.
        (isArabic ? "" : "italic ") +
        className
      }
    >
      {t("content.untranslated")}
    </p>
  );
}
