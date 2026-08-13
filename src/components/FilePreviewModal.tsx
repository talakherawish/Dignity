import { useEffect } from "react";
import { Download, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * In-place viewer for a PDF or image attachment, shared by every card that
 * carries a file -- Publications, Clippings, both grids on a research page,
 * and Information's regulations/forms.
 *
 * These used to be a bare "download" link: reading one meant leaving the
 * site and opening whatever PDF viewer the OS defaults to. This renders the
 * file itself over the page, the same way the photo lightbox already does,
 * and keeps downloading as an explicit choice inside it rather than the only
 * option.
 */
export type PreviewFile = {
  url: string;
  mimeType?: string;
  title: string;
};

/** application/pdf or image/* -- the two types a browser can render inline. */
export function isPreviewableFile(mimeType?: string): boolean {
  return mimeType === "application/pdf" || (mimeType?.startsWith("image/") ?? false);
}

export function FilePreviewModal({ file, onClose }: { file: PreviewFile; onClose: () => void }) {
  const { isArabic } = useLanguage();
  const isPdf = file.mimeType === "application/pdf";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // The page behind the viewer shouldn't scroll under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-stretch bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={file.title}
    >
      <div
        className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 pb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="truncate text-sm text-white/80">{file.title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={file.url}
            download
            aria-label={isArabic ? "تنزيل" : "Download"}
            title={isArabic ? "تنزيل" : "Download"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label={isArabic ? "إغلاق" : "Close"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Clicking the file itself shouldn't dismiss -- only the backdrop. */}
      <div
        className="mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-auto rounded-sm bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {isPdf ? (
          <iframe src={file.url} title={file.title} className="h-full min-h-[75vh] w-full" />
        ) : (
          <img
            src={file.url}
            alt={file.title}
            className="mx-auto block max-h-[85vh] w-auto object-contain"
          />
        )}
      </div>
    </div>
  );
}
