import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchPartners, mediaUrl, type PayloadPartner } from "@/lib/payload";
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

function PartnerCard({ partner }: { partner: PayloadPartner }) {
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
  /* No panel, no shadow, no lift: the logo sits flat on the page, and the
     only thing hovering changes is the name's colour. It was a white card
     raised on a shadow, which read as an object floating above the page rather
     than as a mark printed on it.

     The box is still a fixed 6:5 so the names line up across a row, but it is
     invisible -- nothing is drawn for it -- and the padding is down to 0.5rem,
     so a roughly square crest very nearly fills it. That is as close a crop as
     `object-contain` allows without cutting the artwork.

     No background of its own means a logo drawn in white on transparency would
     disappear. Every current one is in colour, and the site has no dark mode
     (`.dark` exists in styles.css but is never applied), so the page behind is
     reliably light. */
  const plate = (
    <div className="flex aspect-[6/5] w-full items-center justify-center p-2">
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

  // Partners is one collection: the institutions themselves. It used to be two
  // -- these, plus a prose document for the page's heading and a one-line
  // introduction -- and two sidebar entries for one page confused everyone
  // looking for where to add a partner. The heading now comes from the site's
  // own navigation label, and there is no introduction. No staleTime: an
  // editor publishing a partner expects it on the next load.
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: fetchPartners,
  });

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("about")}
        eyebrowColor={SECTION_COLORS.about}
        title={t("about.partners")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="aspect-[6/5] w-full animate-pulse rounded-sm bg-secondary/40 sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)]"
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
