import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  eyebrow,
  eyebrowColor,
  title,
  description,
}: {
  eyebrow?: string;
  /** Defaults to the site's magenta -- pass a `SECTION_COLORS` value to match the eyebrow to the page's nav group. */
  eyebrowColor?: string;
  title: string;
  description?: string;
}) {
  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 text-center">
        {eyebrow && (
          <p
            className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-3"
            style={{ color: eyebrowColor ?? "var(--brand-magenta)" }}
          >
            {eyebrow}
          </p>
        )}
        {/* Matches the description below it: a line break typed into the CMS
            is a line break here. */}
        <h1 className="font-serif text-3xl md:text-4xl text-primary tracking-tight whitespace-pre-line">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}

export function ImagePlaceholder({ label, ratio = "16/9" }: { label?: string; ratio?: string }) {
  return (
    <div
      className="w-full bg-secondary border border-border rounded-md flex items-center justify-center text-sm text-muted-foreground"
      style={{ aspectRatio: ratio }}
    >
      {label ?? "Image placeholder"}
    </div>
  );
}
