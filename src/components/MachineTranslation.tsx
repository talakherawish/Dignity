import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/translate";

/**
 * In place of text the team wrote in the other language only (an annotation,
 * a reading's note): the site's notice that it isn't available in this
 * language yet, and a machine translation on request -- shown in its own
 * marked box, so no one takes it for the team's own words.
 */
export function MachineTranslation({
  text,
  from,
  className = "",
}: {
  text: string;
  from: "en" | "ar";
  className?: string;
}) {
  const { t, isArabic } = useLanguage();
  const [state, setState] = useState<"idle" | "loading" | "failed">("idle");
  const [translated, setTranslated] = useState<string | null>(null);

  const run = () => {
    setState("loading");
    translate(text, from, isArabic ? "ar" : "en").then(
      (result) => {
        setTranslated(result);
        setState("idle");
      },
      () => setState("failed"),
    );
  };

  return (
    <div className={"max-w-3xl text-start text-xs text-muted-foreground " + className}>
      {translated ? (
        <div className="rounded-e-sm border-s-2 border-[color:var(--brand-magenta)]/40 bg-secondary/30 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t("translate.machine")}
          </p>
          <p dir="auto" className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {translated}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <TranslationNotice compact />
          <button
            type="button"
            onClick={run}
            disabled={state === "loading"}
            className="inline-flex items-center gap-1.5 text-[color:var(--brand-magenta)] hover:underline disabled:opacity-70"
          >
            {state === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Languages className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {t("translate.auto")}
          </button>
          {state === "failed" && <span>{t("translate.failed")}</span>}
        </div>
      )}
    </div>
  );
}
