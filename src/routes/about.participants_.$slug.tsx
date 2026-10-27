import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Mail } from "lucide-react";
import { ForumGrid } from "@/components/ForumGrid";
import { PublicationGrid } from "@/components/OutputSection";
import { PageLayout } from "@/components/PageLayout";
import { mapPayloadParticipant } from "@/components/ParticipantModal";
import { PhotoGallery, toGalleryPhoto } from "@/components/PhotoGallery";
import { ProfileLinks } from "@/components/ProfileLinks";
import { FormattedText, RichText } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";
import { hasProse, type PayloadParticipant } from "@/lib/payload";
import { contributionsQuery, participantPageQuery } from "@/lib/queries";
import { SECTION_COLORS } from "@/lib/sectionColors";

/**
 * A Working Group member's own page, for those who have one (Full Page in
 * their admin entry) -- reached from the button in their pop-up. Their card
 * stays in view on one side while the bio and their work scroll on the other:
 * everything on this website that credits them, less what their entry hides,
 * and what they've published elsewhere.
 *
 * "participants_" rather than "participants": the trailing underscore keeps
 * this page from nesting inside the Working Group page's component.
 */
export const Route = createFileRoute("/about/participants_/$slug")({
  loader: async ({ context, params }) => {
    const person = await context.queryClient.ensureQueryData(participantPageQuery(params.slug));
    if (person) await context.queryClient.ensureQueryData(contributionsQuery(person));
  },
  component: ParticipantPage,
});

function ParticipantPage() {
  const { slug } = Route.useParams();
  const { isArabic } = useLanguage();
  const { data: person } = useQuery(participantPageQuery(slug));

  const backLink = (
    <Link
      to="/about/participants"
      className="text-xs uppercase tracking-[0.18em] font-semibold hover:opacity-80"
      style={{ color: SECTION_COLORS.about }}
    >
      {isArabic ? "→ مجموعة العمل" : "← Working Group"}
    </Link>
  );

  if (!person) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center" dir={isArabic ? "rtl" : "ltr"}>
          {backLink}
          <p className="mt-6 text-muted-foreground">
            {isArabic ? "هذه الصفحة غير موجودة." : "This page doesn't exist."}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16"
        dir={isArabic ? "rtl" : "ltr"}
      >
        {backLink}
        <div className="mt-6 grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
          <ProfileCard person={person} />
          <ProfileBody person={person} />
        </div>
      </div>
    </PageLayout>
  );
}

/** Photo, then name, then role, then links -- one card, held in view while the page scrolls. */
function ProfileCard({ person }: { person: PayloadParticipant }) {
  const { lang } = useLanguage();
  const profile = mapPayloadParticipant(person);
  const isAr = lang === "ar";

  return (
    <aside className="self-start lg:sticky lg:top-[127px]">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {profile.photo && (
          <img
            src={profile.photo}
            srcSet={profile.photoSrcSet}
            sizes="300px"
            alt={profile.name}
            className="aspect-square w-full object-cover bg-secondary"
          />
        )}
        <div className="p-6">
          <h1 className="font-serif text-2xl leading-tight text-primary">
            {isAr ? profile.nameAr : profile.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <FormattedText
              rich={isAr ? profile.titleRichAr : profile.titleRich}
              text={isAr ? profile.titleAr : profile.title}
            />
          </p>
          {(profile.email || profile.links.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-1 -ms-1.5">
              {profile.email && (
                <a
                  href={"mailto:" + profile.email}
                  title={profile.email}
                  aria-label={profile.email}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
              <ProfileLinks links={profile.links} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="mb-6 font-serif text-2xl text-primary md:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

function ProfileBody({ person }: { person: PayloadParticipant }) {
  const { lang, isArabic } = useLanguage();
  const { data: work } = useQuery(contributionsQuery(person));

  const fullBio = isArabic ? person.fullBioAr : person.fullBio;
  const shortBio = isArabic ? (person.bioAr ?? person.bio) : person.bio;
  const elsewhere = person.otherPublications ?? [];

  return (
    <div className="min-w-0">
      {hasProse(fullBio) ? (
        <RichText
          value={fullBio}
          className="space-y-4 text-base leading-relaxed text-foreground/85"
        />
      ) : (
        shortBio && (
          <p className="whitespace-pre-line text-base leading-relaxed text-foreground/85">
            {shortBio}
          </p>
        )
      )}

      {work && work.publications.length > 0 && (
        <Section title={isArabic ? "المنشورات" : "Publications"}>
          <PublicationGrid items={work.publications} />
        </Section>
      )}

      {elsewhere.length > 0 && (
        <Section title={isArabic ? "منشورات أخرى" : "Published Elsewhere"}>
          <ul className="divide-y divide-border border-y border-border">
            {elsewhere.map((item, index) => {
              const title = (isArabic && item.titleAr) || item.title;
              const details = [item.publishedIn, item.year].filter(Boolean).join(", ");
              return (
                <li key={item.id ?? index} className="py-4">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-start gap-2 font-serif text-lg leading-snug text-primary hover:text-accent transition-colors"
                    >
                      {title}
                      <ExternalLink className="mt-1.5 h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <span className="font-serif text-lg leading-snug text-primary">{title}</span>
                  )}
                  {details && <p className="mt-1 text-sm text-muted-foreground">{details}</p>}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {work && work.forums.length > 0 && (
        <Section title={isArabic ? "المنتديات" : "Forums"}>
          <ForumGrid items={work.forums} />
        </Section>
      )}

      {work && work.photos.length > 0 && (
        <Section title={isArabic ? "صور" : "Photos"}>
          <PhotoGallery
            photos={work.photos
              .map((p) => toGalleryPhoto(p, lang === "ar" ? "ar" : "en"))
              .filter((photo) => photo.url)}
          />
        </Section>
      )}
    </div>
  );
}
