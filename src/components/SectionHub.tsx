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
 * The icon tile grid every section hub (About, Activities, Publications,
 * Information) uses to link out to its subsections -- one shared look
 * regardless of section color or how many tiles it holds. `color` sets
 * `--tile-accent`, which the tiles read on hover to fill with that section's
 * nav color (see SECTION_COLORS) instead of one fixed accent.
 */
export function SectionTileGrid({ tiles, color }: { tiles: SectionTile[]; color?: string }) {
  const { t, isArabic } = useLanguage();
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      dir={isArabic ? "rtl" : "ltr"}
      style={color ? ({ "--tile-accent": color } as React.CSSProperties) : undefined}
    >
      {tiles.map((tile) => (
        <Link
          key={tile.labelKey}
          to={tile.to}
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
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-6">
        <SectionTileGrid tiles={tiles} color={eyebrowColor} />
      </section>
    </PageLayout>
  );
}
