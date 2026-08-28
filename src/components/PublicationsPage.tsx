import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import {
  PublicationCard,
  PublicationCardGrid,
  PUBLICATION_GRID_SKELETON,
  type PublicationCardAuthor,
} from "@/components/PublicationCard";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import {
  fetchPublications,
  mediaUrl,
  populated,
  youtubeThumbnail,
  type PayloadParticipant,
  type PublicationCollection,
  type PayloadPublication,
} from "@/lib/payload";
import { SECTION_COLORS } from "@/lib/sectionColors";

/** Normalized shape both Payload docs and hardcoded fallback items get mapped into. */
type DisplayPublication = {
  id: string;
  title: string;
  titleAr?: string;
  author?: string;
  authorAr?: string;
  authorParticipants?: PublicationCardAuthor[];
  date: string;
  fileUrl: string;
  fileMimeType?: string;
  fileUrlAr: string;
  fileMimeTypeAr?: string;
  fileSize?: number;
  fileSizeAr?: number;
  previewUrl: string;
  previewWidth?: number;
  previewHeight?: number;
  /** External destination (YouTube) for items that aren't uploads. */
  linkUrl: string;
  linkUrlAr: string;
};

function fromPayload(item: PayloadPublication): DisplayPublication {
  const imageIsPhoto = item.image?.mimeType?.startsWith("image/") ?? false;
  // Prefer a manually-set cover image if one exists; otherwise fall back to
  // the auto-generated PDF page-1 thumbnail attached to whichever media doc
  // (cover image or the file itself) has one, and finally — for link-only
  // items such as videos, which have no file to rasterise — the poster frame
  // published alongside the video itself. Its own dimensions travel with it,
  // when known, so the card can show it at its own proportions rather than
  // cropping it into a fixed box.
  const previewSource = imageIsPhoto ? item.image : (item.image?.thumbnail ?? item.file?.thumbnail);
  const previewUrl = previewSource ? mediaUrl(previewSource) : youtubeThumbnail(item.link);
  return {
    linkUrl: item.link ?? "",
    linkUrlAr: item.linkAr ?? "",
    id: item.id,
    title: item.title,
    titleAr: item.titleAr,
    author: item.author,
    authorAr: item.authorAr,
    authorParticipants: populated<PayloadParticipant>(item.authorParticipants).map((p) => ({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
    })),
    date: item.date,
    fileUrl: mediaUrl(item.file),
    fileMimeType: item.file?.mimeType,
    fileUrlAr: mediaUrl(item.fileAr),
    fileMimeTypeAr: item.fileAr?.mimeType,
    fileSize: item.file?.filesize,
    fileSizeAr: item.fileAr?.filesize,
    previewUrl,
    previewWidth: previewSource?.width,
    previewHeight: previewSource?.height,
  };
}

export function PublicationsPage({
  type,
  titleKey,
  breadcrumb,
}: {
  type: PublicationCollection;
  titleKey: TranslationKey;
  breadcrumb?: string;
}) {
  const { t } = useLanguage();
  // No staleTime: an editor publishing a change in the admin expects to see
  // it on the next load, not up to five minutes later.
  const { data: payloadItems = [], isLoading } = useQuery({
    queryKey: ["publications", type],
    queryFn: () => fetchPublications(type),
  });

  // Payload is the only source. A type with nothing published shows the empty
  // state below rather than a hardcoded stand-in nobody can edit.
  const items: DisplayPublication[] = payloadItems.map(fromPayload);

  return (
    <PageLayout>
      <PageHero
        eyebrow={breadcrumb || t("publications")}
        eyebrowColor={SECTION_COLORS.publications}
        title={t(titleKey)}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className={PUBLICATION_GRID_SKELETON}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="border border-border rounded-sm h-96 bg-secondary/30 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {t("publications.empty")}
          </p>
        ) : (
          <PublicationCardGrid>
            {items.map((item) => (
              <PublicationCard
                key={item.id}
                title={item.title}
                titleAr={item.titleAr}
                author={item.author}
                authorAr={item.authorAr}
                authorParticipants={item.authorParticipants}
                date={item.date}
                previewUrl={item.previewUrl}
                previewWidth={item.previewWidth}
                previewHeight={item.previewHeight}
                fileUrl={item.fileUrl}
                fileMimeType={item.fileMimeType}
                fileUrlAr={item.fileUrlAr}
                fileMimeTypeAr={item.fileMimeTypeAr}
                fileSize={item.fileSize}
                fileSizeAr={item.fileSizeAr}
                linkUrl={item.linkUrl}
                linkUrlAr={item.linkUrlAr}
              />
            ))}
          </PublicationCardGrid>
        )}
      </section>
    </PageLayout>
  );
}
