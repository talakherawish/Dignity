import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PublicationCard, PublicationCardGrid } from "./PublicationCard";
import {
  mediaUrl,
  populated,
  youtubeThumbnail,
  type PayloadParticipant,
  type PayloadPublication,
} from "@/lib/payload";

/**
 * One output group — the heading is a toggle and the grid below it starts
 * collapsed. Callers only mount a section when its collection has items, so a
 * visible heading always has something behind it to open.
 *
 * Shared by the Research area detail page and any Activity-line page (Task
 * Force on AI, Idea Factory) that groups its own outputs the same way --
 * extracted here so both stay visually and behaviorally identical rather than
 * drifting apart as two copies of the same component.
 */
export function OutputSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-5 text-start group cursor-pointer"
      >
        <h3 className="font-serif text-2xl md:text-3xl text-primary group-hover:text-accent transition-colors">
          {title}
          <span className="text-base text-muted-foreground ms-2">({count})</span>
        </h3>
        <ChevronDown
          className={
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" +
            (open ? " rotate-180" : "")
          }
        />
      </button>
      {open && <div className="pb-10">{children}</div>}
    </div>
  );
}

/** The card grid shared by all seven publication collections. */
export function PublicationGrid({
  items,
  showDownload,
}: {
  items: PayloadPublication[];
  showDownload?: boolean;
}) {
  return (
    <PublicationCardGrid>
      {items.map((p) => {
        // A manually-set cover image wins; otherwise the auto-generated PDF
        // page-1 thumbnail, wherever it's attached. Its own dimensions travel
        // with it so the card shows it at its own proportions rather than
        // cropping it into a fixed box.
        const previewSource = p.image?.thumbnail ?? p.image ?? p.file?.thumbnail;
        const previewUrl = previewSource ? mediaUrl(previewSource) : youtubeThumbnail(p.link);
        return (
          <PublicationCard
            key={p.id}
            as="h4"
            title={p.title}
            titleAr={p.titleAr}
            author={p.author}
            authorAr={p.authorAr}
            authorParticipants={populated<PayloadParticipant>(p.authorParticipants).map((a) => ({
              id: a.id,
              name: a.name,
              nameAr: a.nameAr,
            }))}
            date={p.date}
            previewUrl={previewUrl}
            previewWidth={previewSource?.width}
            previewHeight={previewSource?.height}
            fileUrl={showDownload && p.file ? mediaUrl(p.file) : ""}
            fileMimeType={showDownload ? p.file?.mimeType : undefined}
            fileUrlAr={showDownload && p.fileAr ? mediaUrl(p.fileAr) : ""}
            fileMimeTypeAr={showDownload ? p.fileAr?.mimeType : undefined}
            fileSize={showDownload ? p.file?.filesize : undefined}
            fileSizeAr={showDownload ? p.fileAr?.filesize : undefined}
            // Audiovisual entries are a link rather than an upload. Without this
            // they rendered as a bare thumbnail: no play button, nothing
            // clickable, no way to reach the video the entry exists to point at.
            linkUrl={p.link ?? ""}
            linkUrlAr={p.linkAr ?? ""}
          />
        );
      })}
    </PublicationCardGrid>
  );
}
