import { useQuery } from "@tanstack/react-query";
import { PageLayout, PageHero } from "@/components/PageLayout";
import {
  PublicationCard,
  PublicationCardGrid,
  PUBLICATION_GRID_SKELETON,
} from "@/components/PublicationCard";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import {
  fetchPublications,
  mediaUrl,
  youtubeThumbnail,
  type PublicationCollection,
  type PayloadPublication,
} from "@/lib/payload";

/** Normalized shape both Payload docs and hardcoded fallback items get mapped into. */
type DisplayPublication = {
  id: string;
  title: string;
  titleAr?: string;
  author?: string;
  authorAr?: string;
  date: string;
  fileUrl: string;
  previewUrl: string;
  /** External destination (YouTube) for items that aren't uploads. */
  linkUrl: string;
};

function fromPayload(item: PayloadPublication): DisplayPublication {
  const imageIsPhoto = item.image?.mimeType?.startsWith("image/") ?? false;
  // Prefer a manually-set cover image if one exists; otherwise fall back to
  // the auto-generated PDF page-1 thumbnail attached to whichever media doc
  // (cover image or the file itself) has one, and finally — for link-only
  // items such as videos, which have no file to rasterise — the poster frame
  // published alongside the video itself.
  const previewUrl = imageIsPhoto
    ? mediaUrl(item.image)
    : mediaUrl(item.image?.thumbnail) ||
      mediaUrl(item.file?.thumbnail) ||
      youtubeThumbnail(item.link);
  return {
    linkUrl: item.link ?? "",
    id: item.id,
    title: item.title,
    titleAr: item.titleAr,
    author: item.author,
    authorAr: item.authorAr,
    date: item.date,
    fileUrl: mediaUrl(item.file),
    previewUrl,
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
  const { data: payloadItems = [], isLoading } = useQuery({
    queryKey: ["publications", type],
    queryFn: () => fetchPublications(type),
    staleTime: 5 * 60 * 1000,
  });

  // Payload is the only source. A type with nothing published shows the empty
  // state below rather than a hardcoded stand-in nobody can edit.
  const items: DisplayPublication[] = payloadItems.map(fromPayload);

  return (
    <PageLayout>
      <PageHero
        eyebrow={breadcrumb || `${t("publications")} — ${t(titleKey)}`}
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
                date={item.date}
                previewUrl={item.previewUrl}
                fileUrl={item.fileUrl}
                linkUrl={item.linkUrl}
              />
            ))}
          </PublicationCardGrid>
        )}
      </section>
    </PageLayout>
  );
}
