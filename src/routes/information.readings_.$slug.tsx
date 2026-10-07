import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { PageLayout, PageHero } from "@/components/PageLayout";
import { RichText } from "@/components/RichText";
import { TranslationNotice } from "@/components/TranslationNotice";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { keywordLabel, keywordsOf } from "@/lib/keywords";
import {
  fetchReading,
  formatFileSize,
  hasProse,
  mediaUrl,
  openFileInNewTab,
  populated,
  resolveAttachment,
  type PayloadParticipant,
  type PayloadReading,
} from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

// "readings_" rather than "readings": the trailing underscore keeps this page
// from nesting inside the list page's component, which has no <Outlet />.
export const Route = createFileRoute("/information/readings_/$slug")({
  component: ReadingPage,
});

const RIGHTS_LABEL: Partial<Record<NonNullable<PayloadReading["rights"]>, TranslationKey>> = {
  publicDomain: "readings.rights.publicDomain",
  openLicence: "readings.rights.openLicence",
  permission: "readings.rights.permission",
};

const button =
  "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground/80 transition-colors hover:border-accent/40 hover:text-accent";

function ReadingPage() {
  const { slug } = Route.useParams();
  const { t, isArabic } = useLanguage();
  const { data: reading, isLoading } = useQuery({
    queryKey: ["reading", slug],
    queryFn: () => fetchReading(slug),
  });

  if (!reading) {
    return (
      <PageLayout>
        <PageHero
          eyebrow={t("information.readings")}
          eyebrowColor={SECTION_COLORS.information}
          title={isLoading ? "" : t("readings.empty")}
        />
      </PageLayout>
    );
  }

  const title = isArabic ? (reading.titleAr ?? reading.title) : reading.title;
  // The write-up is read in the visitor's own language only -- see
  // TranslationNotice for why it doesn't fall back to the other one.
  const writeUp = isArabic ? reading.descriptionAr : reading.description;
  const untranslated =
    !hasProse(writeUp) && hasProse(isArabic ? reading.description : reading.descriptionAr);

  const file = resolveAttachment(
    mediaUrl(reading.file) || undefined,
    mediaUrl(reading.fileAr) || undefined,
    isArabic,
  ).value;
  const fileMedia = isArabic && reading.fileAr ? reading.fileAr : reading.file;
  const link = resolveAttachment(reading.link, reading.linkAr, isArabic).value;
  const cover = mediaUrl(fileMedia?.thumbnail);
  const rights = reading.rights && RIGHTS_LABEL[reading.rights];

  const authors = (reading.authors ?? []).map((a) => a.name).join(", ");
  const writers = populated<PayloadParticipant>(reading.writtenBy).map((p) =>
    isArabic ? (p.nameAr ?? p.name) : p.name,
  );
  const keywords = keywordsOf(reading);
  // The text's own details are in its own language, like a citation.
  const sourceDir = reading.language === "ar" ? "rtl" : "ltr";

  return (
    <PageLayout>
      <PageHero
        eyebrow={t("information.readings")}
        eyebrowColor={SECTION_COLORS.information}
        title={title}
      />

      <article
        className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:px-8"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <Link
          to="/information/readings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[color:var(--brand-magenta)]"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("readings.back")}
        </Link>

        <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-14">
          <div className="min-w-0">
            {hasProse(writeUp) && (
              <RichText
                value={writeUp}
                className="space-y-4 text-[15px] leading-relaxed text-foreground"
              />
            )}
            {untranslated && <TranslationNotice />}
            {writers.length > 0 && (
              <p className="mt-8 text-sm text-muted-foreground">
                {t("readings.writtenBy")}: {writers.join(isArabic ? "، " : ", ")}
              </p>
            )}
          </div>

          {/* The text itself: what it is, where it came from, and the way in. */}
          {/* First on a phone, so the text and its download come before the write-up. */}
          <aside className="order-first space-y-6 md:order-last">
            {cover && (
              <button
                type="button"
                onClick={() => file && openFileInNewTab(file, fileMedia?.mimeType)}
                className="block w-40 overflow-hidden rounded-sm border border-border shadow-sm transition-shadow hover:shadow-md md:w-full"
              >
                <img src={cover} alt="" className="w-full" />
              </button>
            )}

            <div className="space-y-2 text-sm">
              {authors && (
                <p dir={sourceDir} className="text-start font-serif text-base text-primary">
                  {authors}
                </p>
              )}
              {reading.year && <p className="text-muted-foreground">{reading.year}</p>}
              {reading.translator && (
                <p>
                  <span className="text-muted-foreground">{t("readings.translatedBy")}: </span>
                  <span dir={sourceDir}>{reading.translator}</span>
                </p>
              )}
              {reading.sourceName && (
                <p>
                  <span className="text-muted-foreground">{t("readings.source")}: </span>
                  {reading.sourceName}
                </p>
              )}
            </div>

            {(file || link) && (
              <div className="flex flex-wrap gap-2">
                {file && (
                  <>
                    <button
                      type="button"
                      onClick={() => openFileInNewTab(file, fileMedia?.mimeType)}
                      className={button}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("publications.view")}
                    </button>
                    <a
                      href={file}
                      download
                      title={formatFileSize(fileMedia?.filesize)}
                      className={button}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("publications.download")}
                    </a>
                  </>
                )}
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" className={button}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("readings.readOnline")}
                  </a>
                )}
              </div>
            )}

            {rights && file && (
              <p
                className={
                  "uppercase tracking-[0.16em] text-muted-foreground " +
                  (isArabic ? "text-[14px]" : "text-[10px]")
                }
              >
                {t(rights)}
              </p>
            )}

            {keywords.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 border-t border-border pt-6">
                {keywords.map((keyword) => (
                  <li key={keyword.id}>
                    <Link
                      to="/information/readings"
                      search={{ keyword: keyword.id }}
                      className="inline-block rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-[color:var(--brand-magenta)]/50 hover:text-[color:var(--brand-magenta)]"
                    >
                      {keywordLabel(keyword, isArabic)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </article>
    </PageLayout>
  );
}
