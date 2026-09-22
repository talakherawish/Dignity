import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatFileSize,
  mediaUrl,
  openFileInNewTab,
  populated,
  type PayloadActivity,
  type PayloadForumAttachment,
  type PayloadParticipant,
} from "@/lib/payload";

/**
 * What a forum carries besides its write-up and photographs: the people who
 * took part, and the files attached to it.
 *
 * Both the Forums page's dated ledger and the poster wall shown on a research
 * line render this, so an entry reads the same either way.
 *
 * The file cards are deliberately not `PublicationCard`. A publication is a
 * piece of work in its own right and its card is a framed object -- border,
 * card background, the title set inside the frame. These are papers belonging
 * to one event, shown inside it, and a second grid of bordered boxes inside an
 * already-bordered open entry reads as a page of boxes. So: no frame at all.
 * The preview floats on the entry's own background, lifted by a shadow rather
 * than outlined, and its name sits underneath it in the open rather than
 * inside a panel.
 */

/** The page-1 image Payload rasterises for a PDF; an image file is its own preview. */
function previewOf(file: PayloadForumAttachment["file"]): string {
  if (!file) return "";
  if (file.mimeType?.startsWith("image/")) return mediaUrl(file);
  return file.thumbnail ? mediaUrl(file.thumbnail) : "";
}

/**
 * Whether an entry carries anything this block would render. Both views ask
 * before deciding an entry is worth opening: one whose only content is a
 * programme PDF still has something behind it.
 */
export function hasAdditionalInfo(item: PayloadActivity): boolean {
  return (
    populated<PayloadParticipant>(item.participants).length > 0 ||
    (item.attachments ?? []).some((attachment) => attachment.file?.url)
  );
}

function AttachmentCard({ attachment }: { attachment: PayloadForumAttachment }) {
  const { lang, isArabic } = useLanguage();
  const file = attachment.file;
  const url = mediaUrl(file);
  const title = lang === "ar" ? (attachment.titleAr ?? attachment.title) : attachment.title;
  const preview = previewOf(file);
  const size = formatFileSize(file?.filesize);

  if (!url) return null;

  return (
    <button
      type="button"
      onClick={() => openFileInNewTab(url, file?.mimeType)}
      title={size ? `${title} (${size})` : title}
      className="group w-[7.5rem] shrink-0 cursor-pointer text-start focus:outline-none sm:w-36"
    >
      {/* The lift on hover is the whole affordance -- there's no border to
          change colour and no button to reveal. */}
      <div className="overflow-hidden rounded-sm shadow-[0_6px_18px_-8px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1 motion-reduce:transition-none">
        {preview ? (
          <img
            src={preview}
            alt=""
            loading="lazy"
            /* Page one of a document, cropped from the top: the title block is
               what makes one paper recognisable from another. */
            className="block aspect-[1/1.32] w-full bg-white object-cover object-top"
          />
        ) : (
          <div className="grid aspect-[1/1.32] w-full place-items-center bg-secondary/30">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <span
        className={
          "mt-3 block text-[13px] leading-snug text-foreground transition-colors duration-200 group-hover:text-[color:var(--brand-magenta)] group-focus-visible:text-[color:var(--brand-magenta)] " +
          (isArabic ? "font-arabic" : "")
        }
      >
        {title}
      </span>
      {size && (
        <span className="mt-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
          {size}
        </span>
      )}
    </button>
  );
}

export function ForumAdditionalInfo({ item }: { item: PayloadActivity }) {
  const { t, lang, isArabic } = useLanguage();

  if (!hasAdditionalInfo(item)) return null;

  const people = populated<PayloadParticipant>(item.participants);
  // A row with no file behind it has nothing to show -- the name alone isn't
  // something to press.
  const files = (item.attachments ?? []).filter((attachment) => attachment.file?.url);

  return (
    <section className="border-t border-border pt-6">
      <h5
        className={
          "mb-4 uppercase tracking-[0.2em] text-muted-foreground " +
          (isArabic ? "text-[13px]" : "text-[10px] font-semibold")
        }
      >
        {t("forums.additionalInfo")}
      </h5>

      {people.length > 0 && (
        <div className="mb-6">
          <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">
            {t("forums.participants")}
          </span>
          {/* Each name opens that person's profile on the Working Group page,
              which resolves the id against the whole collection rather than
              the grid -- so someone kept off that page is still reachable
              from here. */}
          <p className="text-sm leading-relaxed text-foreground">
            {people.map((person, index) => (
              <span key={person.id}>
                <Link
                  to="/about/participants"
                  search={{ participant: person.id }}
                  onClick={(event) => event.stopPropagation()}
                  className="font-serif underline-offset-2 hover:text-[color:var(--brand-magenta)] hover:underline"
                >
                  {lang === "ar" ? (person.nameAr ?? person.name) : person.name}
                </Link>
                {index < people.length - 1 ? (isArabic ? "، " : ", ") : ""}
              </span>
            ))}
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-7">
          {files.map((attachment, index) => (
            <AttachmentCard key={attachment.id ?? index} attachment={attachment} />
          ))}
        </div>
      )}
    </section>
  );
}
