import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PageLayout, PageHero } from "./PageLayout";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";

export type SectionTile = {
  labelKey: TranslationKey;
  to: string;
  icon: LucideIcon;
};

/**
 * Fixed per-tile footprint -- every hub page uses the same size tile,
 * matching the original card size (roughly a lg:grid-cols-4 column at
 * max-w-6xl). Fitting an extra tile on a row widens the row rather than
 * shrinking the tiles -- see SectionHubPage's wider max-w-7xl wrapper.
 */
const TILE_WIDTH = 220;
const GAP = 16;

/**
 * How many tiles sit on a row, for a given total. Up to 5 tiles fit on one
 * row together (About and Activities both land here); beyond that, rows cap
 * at 4 so a trailing row is never a single stranded tile -- 6 becomes 4+2,
 * 7 (Publications) becomes 4+3.
 */
function columnsFor(count: number): number {
  return count <= 5 ? count : 4;
}

/**
 * The icon tile grid every section hub (About, Activities, Publications,
 * Information) uses to link out to its subsections -- one shared look
 * regardless of section color or how many tiles it holds. `color` sets
 * `--tile-accent`, which the tiles read on hover to fill with that section's
 * nav color (see SECTION_COLORS) instead of one fixed accent.
 *
 * Tiles are a fixed width, wrapped in a flex row capped at `columnsFor`
 * tiles wide and centered -- capping the row's max-width (rather than
 * relying on grid-template-columns) is what lets a wrapped trailing row
 * center itself independently of the row above it, since each wrapped flex
 * line justifies on its own. Below that width -- and always on mobile,
 * where the viewport itself is the limit -- it wraps and centers further,
 * never dropping below 2 tiles per row on any realistic screen.
 */
export function SectionTileGrid({ tiles, color }: { tiles: SectionTile[]; color?: string }) {
  const { t, isArabic } = useLanguage();
  const cols = columnsFor(tiles.length);
  const maxWidth = cols * TILE_WIDTH + (cols - 1) * GAP;

  return (
    <div
      className="mx-auto flex flex-wrap justify-center gap-4"
      dir={isArabic ? "rtl" : "ltr"}
      style={
        {
          maxWidth: `${maxWidth}px`,
          ...(color ? { "--tile-accent": color } : {}),
        } as React.CSSProperties
      }
    >
      {tiles.map((tile) => (
        <Link
          key={tile.labelKey}
          to={tile.to}
          style={{ width: TILE_WIDTH }}
          className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-8 text-center transition-all duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-md"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary transition-colors duration-200 group-hover:bg-[var(--tile-accent,var(--brand-magenta))]">
            <tile.icon
              className="h-7 w-7 text-foreground/70 transition-colors duration-200 group-hover:text-white"
              strokeWidth={1.6}
            />
          </span>
          <span
            className={
              "text-sm font-medium leading-snug text-foreground/85 " +
              (isArabic ? "font-arabic" : "")
            }
          >
            {t(tile.labelKey)}
          </span>
        </Link>
      ))}
    </div>
  );
}

/**
 * A full hub page: hero, optional intro content, then the tile grid. Used
 * directly by sections with no write-up of their own (Activities,
 * Publications, Information); About composes its own hero and intro instead
 * and renders SectionTileGrid alone beneath them.
 */
export function SectionHubPage({
  eyebrow,
  eyebrowColor,
  title,
  description,
  tiles,
  children,
}: {
  eyebrow?: string;
  eyebrowColor?: string;
  title: string;
  description?: string;
  tiles: SectionTile[];
  children?: ReactNode;
}) {
  return (
    <PageLayout>
      <PageHero
        eyebrow={eyebrow}
        eyebrowColor={eyebrowColor}
        title={title}
        description={description}
      />
      {children}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-6">
        <SectionTileGrid tiles={tiles} color={eyebrowColor} />
      </section>
    </PageLayout>
  );
}
