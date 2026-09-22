import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  extractText,
  fetchPartnerItems,
  fetchPartners,
  mediaUrl,
  type PayloadPartnerItem,
} from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

export const Route = createFileRoute("/about/partners")({
  component: PartnersPage,
});

/**
 * The years a partnership ran, set as its own thing rather than as one more
 * uppercase micro-label.
 *
 * Every other date on this site is either that label -- 11px, uppercase,
 * letter-spaced, muted -- or the ledger's big serif day. Neither fits here:
 * there is no day to show, and a partnership's years are not a filing detail
 * to be tucked under a title. So the numerals lead, set in the serif face at
 * reading size and widely spaced, over a hairline rule.
 *
 * `dir="ltr"` is load-bearing. The digits are Western in both languages (the
 * client's choice, see formatDate), and left to itself an Arabic paragraph
 * would reorder "2019-2024" around the dash.
 */
function PartnerYears({ from, to }: { from?: number; to?: number }) {
  if (!from) return null;
  // An en dash, not a hyphen: this is a span of years, not a compound word.
  const label = to && to !== from ? `${from}–${to}` : String(from);
  return (
    <span
      dir="ltr"
      className="mb-3 inline-block border-t border-[color:var(--brand-magenta)]/40 pt-2 font-serif text-[15px] tracking-[0.18em] tabular-nums text-[color:var(--brand-magenta)]"
    >
      {label}
    </span>
  );
}

function PartnerCard({ partner }: { partner: PayloadPartnerItem }) {
  const { t, lang, isArabic } = useLanguage();
  const name = lang === "ar" ? (partner.nameAr ?? partner.name) : partner.name;
  const description = lang === "ar" ? partner.descriptionAr : partner.description;
  const logo = mediaUrl(partner.logo);
  const href = partner.website;

  /* The logo sits on white whatever the page is doing, because a wordmark
     drawn in dark ink on a transparent background disappears against a dark
     surface -- and an institution's mark is not ours to recolour. Contained,
     never cropped: it is fixed artwork, and a logo cut off at the edge reads
     as a broken image rather than a design. */
  /* 4:3 and lightly padded rather than 16:9 and generously padded. Most
     institutional logos are a roughly square crest or roundel, and a wide
     plate left one stranded in the middle of it with more white either side
     than logo. A wide wordmark still fits -- it just sits width-constrained,
     with space above and below instead. */
  const plate = (
    <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-sm bg-white p-6 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1 motion-reduce:transition-none">
      {logo ? (
        <img
          src={logo}
          alt={partner.logo?.alt || name}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        /* No logo yet: the name set large stands in for it, rather than an
           empty plate or a grey placeholder box pretending a picture is
           coming. */
        <span
          className={
            "text-center font-serif text-lg leading-snug text-primary " +
            (isArabic ? "font-arabic" : "")
          }
        >
          {name}
        </span>
      )}
    </div>
  );

  const body = (
    <>
      {plate}
      <div className="mt-5 flex flex-col items-center">
        <PartnerYears from={partner.startYear} to={partner.endYear} />
        <h3
          className={
            "font-serif text-base leading-snug text-primary transition-colors duration-200 group-hover:text-[color:var(--brand-magenta)] group-focus-visible:text-[color:var(--brand-magenta)] " +
            (isArabic ? "font-arabic" : "")
          }
        >
          {name}
        </h3>
        {/* Often empty, and meant to be: nothing was published about what
            either of the first two partnerships covers, and a card with no
            sentence under the name reads as finished rather than unfinished. */}
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {href && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-[color:var(--brand-magenta)]">
            {t("partners.visitSite")}
            <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </span>
        )}
      </div>
    </>
  );

  // Four across at the widest instead of three. The cards carry a logo and a
  // line of text, not a paragraph, and at a third of the page each they were
  // mostly plate. (The subtraction is the card's share of the 2rem gap:
  // 100%/n - gap*(n-1)/n.)
  const width = "w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)]";

  // A partner with no website is not a link -- there is nowhere for it to go.
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={"group block text-center focus:outline-none " + width}
    >
      {body}
    </a>
  ) : (
    <div className={"group text-center " + width}>{body}</div>
  );
}

function PartnersPage() {
  const { t, isArabic } = useLanguage();

  // The page's own heading and introduction, edited in the CMS under About
  // the Dignity Initiative -> Partners. No staleTime on either query: an
  // editor publishing a change expects it on the next load.
  const { data: page } = useQuery({
    queryKey: ["partners-page"],
    queryFn: fetchPartners,
  });

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partner-items"],
    queryFn: fetchPartnerItems,
  });

  const intro = extractText(isArabic ? page?.bodyAr : page?.body);

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("about")}
        eyebrowColor={SECTION_COLORS.about}
        title={(isArabic ? page?.titleAr : page?.title) || t("about.partners")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Nothing stands in for an empty introduction. This page used to
            print two paragraphs of placeholder prose when the CMS had none,
            which is how it looked finished while being empty. */}
        {intro.length > 0 && (
          <div className="mb-14 max-w-3xl space-y-5 text-sm leading-relaxed text-foreground">
            {intro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="aspect-[4/3] w-full animate-pulse rounded-sm bg-secondary/40 sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)]"
              />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <p className="border-t border-border py-16 text-center text-sm text-muted-foreground">
            {t("partners.empty")}
          </p>
        ) : (
          /* flex-wrap and centred, so two partners sit together in the middle
             of the row rather than hugging the start edge with a third of the
             page left blank beside them. */
          <div className="flex flex-wrap justify-center gap-8" dir={isArabic ? "rtl" : "ltr"}>
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
