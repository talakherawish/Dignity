import { RichText } from "./RichText";
import { TranslationNotice } from "./TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import { hasProse } from "@/lib/payload";

/**
 * The top of a Research area's page and of the Task Force on AI / Idea Factory /
 * Windsor-Birzeit pages, which are laid out to match it: the featured image,
 * then the write-up -- or, when there isn't one in the visitor's language, a
 * notice that it is only written in the other one, or that it isn't written
 * yet. Two pages had each carried their own copy.
 */
export function PageIntro({
  title,
  image,
  body,
  untranslated,
}: {
  title: string;
  /** Resolved URL; nothing is shown when empty. */
  image: string;
  /** The write-up in the visitor's own language. */
  body: unknown;
  /** Written up only in the other language, as opposed to not written at all. */
  untranslated: boolean;
}) {
  const { isArabic } = useLanguage();

  return (
    <>
      {image && (
        <img
          src={image}
          alt={title}
          className="w-full rounded-lg mt-8 object-cover"
          style={{ maxHeight: "26rem" }}
        />
      )}

      {hasProse(body) ? (
        <RichText
          value={body}
          className="mt-8 space-y-5 text-sm text-foreground leading-relaxed opacity-0 animate-[fadeIn_0.8s_ease-in-out_0.3s_forwards]"
        />
      ) : untranslated ? (
        <TranslationNotice className="mt-8" />
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          {isArabic ? "المحتوى قادم قريباً." : "Content coming soon."}
        </p>
      )}
    </>
  );
}
