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

export function PageHero({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <section className="border-b border-border bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {eyebrow && (
          <div className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">{eyebrow}</div>
        )}
        <h1 className="font-serif text-4xl md:text-5xl text-primary tracking-tight">{title}</h1>
        {description && (
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground leading-relaxed">{description}</p>
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
