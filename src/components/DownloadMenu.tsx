import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatFileSize, mediaUrl, type PayloadPublication } from "@/lib/payload";
import { downloadPdfAsImages, type ImageFormat } from "@/lib/pdfImages";

/**
 * The download badge on a publication card's preview. With one thing to offer
 * it downloads it straight away, as before; with more it opens a small menu:
 * the file itself, the PDF as images (see pdfImages), and every other format
 * an editor uploaded for it ("Other Formats" in the admin).
 */

type Format = NonNullable<PayloadPublication["otherFormats"]>[number];

/** A format's name from its file type, when the editor didn't give one. */
const TYPE_NAMES: [RegExp, string, string][] = [
  [/\.(docx?|odt|rtf)$/i, "Word", "وورد"],
  [/\.(pptx?|odp|key)$/i, "PowerPoint", "باوربوينت"],
  [/\.(xlsx?|ods|csv)$/i, "Excel", "إكسل"],
  [/\.(png|jpe?g|webp|tiff?|gif)$/i, "Image", "صورة"],
  [/\.pdf$/i, "PDF", "PDF"],
  [/\.epub$/i, "EPUB", "EPUB"],
  [/\.indd$/i, "InDesign", "InDesign"],
  [/\.(ai|eps|svg)$/i, "Vector", "ملف متجه"],
  [/\.zip$/i, "ZIP", "ZIP"],
];

function typeName(filename: string | undefined, isArabic: boolean): string {
  const name = filename ?? "";
  const known = TYPE_NAMES.find(([pattern]) => pattern.test(name));
  if (known) return isArabic ? known[2] : known[1];
  return name.split(".").pop()?.toUpperCase() || (isArabic ? "ملف" : "File");
}

/** A file to download as it is, or images to make from the PDF. */
type Item = {
  key: string;
  label: string;
  detail?: string;
  href?: string;
  image?: ImageFormat;
};

const itemClass =
  "flex w-full items-center justify-between gap-4 px-3 py-2 text-start text-sm text-foreground hover:bg-secondary/60 transition-colors";

export function DownloadMenu({
  fileUrl,
  fileName,
  fileMimeType,
  fileSize,
  otherFormats,
  label,
}: {
  fileUrl: string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  otherFormats?: Format[];
  /** "Download", for the badge's own name. */
  label: string;
}) {
  const { isArabic } = useLanguage();
  const [open, setOpen] = useState(false);
  // Which image download is being made, and how far along; which one failed.
  const [busy, setBusy] = useState<{ key: string; progress: string } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Closes on a click anywhere else, or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isPdf = fileMimeType === "application/pdf" || /\.pdf($|\?)/i.test(fileName ?? fileUrl);
  const items: Item[] = [
    {
      key: "file",
      label: typeName(fileName ?? new URL(fileUrl, "https://x").pathname, isArabic),
      detail: formatFileSize(fileSize),
      href: fileUrl,
    },
  ];
  if (isPdf) {
    items.push(
      { key: "png", label: isArabic ? "صور (PNG)" : "Images (PNG)", image: "png" },
      { key: "jpg", label: isArabic ? "صور (JPG)" : "Images (JPG)", image: "jpeg" },
    );
  }
  const makeImages = async (item: Item) => {
    if (!item.image) return;
    setFailed(null);
    setBusy({ key: item.key, progress: "…" });
    try {
      await downloadPdfAsImages(fileUrl, item.image, (done, total) =>
        setBusy({ key: item.key, progress: total > 1 ? `${done}/${total}` : "…" }),
      );
      setOpen(false);
    } catch {
      setFailed(item.key);
    } finally {
      setBusy(null);
    }
  };
  for (const [index, format] of (otherFormats ?? []).entries()) {
    const media = typeof format.file === "object" ? format.file : undefined;
    const href = mediaUrl(media);
    if (!href) continue;
    const named = (isArabic ? format.labelAr || format.label : format.label)?.trim();
    items.push({
      key: format.id ?? String(index),
      label: named || typeName(media?.filename, isArabic),
      detail: formatFileSize(media?.filesize),
      href,
    });
  }

  const badgeClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75";
  const title = items[0].detail ? `${label} (${items[0].detail})` : label;

  // Clicks and keys stop here: the card around this opens the file on both.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  if (items.length === 1) {
    return (
      <a
        href={fileUrl}
        download
        onClick={stop}
        aria-label={title}
        title={title}
        className={"absolute top-2 end-2 z-10 " + badgeClass}
      >
        <Download className="h-3.5 w-3.5" />
      </a>
    );
  }

  return (
    <div ref={ref} className="absolute top-2 end-2 z-10" onClick={stop} onKeyDown={stop}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        title={label}
        className={badgeClass}
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-10 end-0 min-w-48 overflow-hidden rounded-md border border-border bg-card py-1 shadow-lg"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {items.map((item) =>
            item.href ? (
              <a
                key={item.key}
                role="menuitem"
                href={item.href}
                download
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <span>{item.label}</span>
                {item.detail && (
                  <span className="text-xs text-muted-foreground">{item.detail}</span>
                )}
              </a>
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={busy !== null}
                onClick={() => void makeImages(item)}
                className={itemClass + " disabled:opacity-70"}
              >
                <span>{item.label}</span>
                {busy?.key === item.key ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {busy.progress}
                  </span>
                ) : (
                  failed === item.key && (
                    <span className="text-xs text-destructive">
                      {isArabic ? "تعذّر" : "Failed"}
                    </span>
                  )
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
