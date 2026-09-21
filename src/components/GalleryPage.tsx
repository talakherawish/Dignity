import { PageLayout, PageHero } from "@/components/PageLayout";
import { PhotoGallery, type GalleryPhoto } from "@/components/PhotoGallery";

/**
 * A page that is one justified photo gallery under a hero: Photos, Clippings,
 * and Stickers & Bookmarks. They had each carried their own copy of this
 * shell -- the loading placeholder, the empty message, the gallery -- and
 * differed only in where their pictures came from and what they said, which is
 * all they still supply.
 */
export function GalleryPage({
  eyebrow,
  eyebrowColor,
  title,
  photos,
  isLoading,
  empty,
}: {
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  photos: GalleryPhoto[];
  isLoading: boolean;
  /** Shown when there is nothing to show, in the reader's language. */
  empty: string;
}) {
  // An entry whose upload went missing would otherwise render as a broken
  // image in the middle of the gallery.
  const shown = photos.filter((photo) => photo.url);

  return (
    <PageLayout>
      <PageHero eyebrow={eyebrow} eyebrowColor={eyebrowColor} title={title} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          // Mixed widths at one height, so the placeholder rows read like the
          // justified rows that replace them.
          <div className="flex flex-wrap [--row-height:12rem] sm:[--row-height:16rem] lg:[--row-height:20rem]">
            {[1.5, 0.75, 1.3, 1.8, 1, 1.4].map((ratio, n) => (
              <div
                key={n}
                style={{ flexGrow: ratio, flexBasis: `calc(var(--row-height) * ${ratio})` }}
                className="h-[var(--row-height)] bg-secondary/30 animate-pulse"
              />
            ))}
            <span aria-hidden className="grow-[999] basis-0 h-0" />
          </div>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">{empty}</p>
        ) : (
          <PhotoGallery photos={shown} />
        )}
      </section>
    </PageLayout>
  );
}
