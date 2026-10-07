import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { copyCitation, type Segment } from "@/lib/citation";

/** The citation as the page shows it. */
export function Citation({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((segment, i) =>
        segment.italic ? (
          // Arabic has no italic; a browser's slanted Arabic reads as broken,
          // so Arabic titles are set in bold, as Arabic bibliographies do.
          <cite key={i} className="italic [&:lang(ar)]:font-semibold [&:lang(ar)]:not-italic">
            {segment.text}
          </cite>
        ) : (
          segment.text
        ),
      )}
    </>
  );
}

/**
 * Copies a Chicago citation -- or, given an annotation, the citation with its
 * annotation beneath, as an annotated bibliography lays them out -- ready to
 * paste into a bibliography. See copyCitation for the formats it copies.
 */
export function CopyCitation({
  segments,
  arabic,
  annotation,
}: {
  segments: Segment[];
  arabic: boolean;
  annotation?: string;
}) {
  const { t, isArabic } = useLanguage();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const label =
    state === "copied"
      ? t("citation.copied")
      : state === "failed"
        ? t("citation.failed")
        : t(annotation ? "citation.copyWithAnnotation" : "citation.copy");

  return (
    <button
      type="button"
      onClick={() =>
        copyCitation(segments, { annotation, arabic }).then(
          () => setState("copied"),
          () => setState("failed"),
        )
      }
      aria-live="polite"
      className={
        "inline-flex items-center gap-1.5 text-xs transition-colors " +
        (state === "copied"
          ? "text-[color:var(--brand-magenta)]"
          : "text-muted-foreground hover:text-[color:var(--brand-magenta)]") +
        (isArabic ? " font-arabic" : "")
      }
    >
      {state === "copied" ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}
