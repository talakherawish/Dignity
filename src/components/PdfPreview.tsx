import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { loadPdf, type PdfDocument } from "@/lib/pdf";

/**
 * A PDF read inside the page -- a book's preview -- page under page in a
 * scrolling frame. Each page is drawn as it comes near view, so opening a
 * long book doesn't draw every page at once; until then it holds its place at
 * the first page's proportions.
 */
export function PdfPreview({ url }: { url: string }) {
  const { isArabic } = useLanguage();
  const frame = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<{ doc: PdfDocument; ratio: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let doc: PdfDocument | undefined;
    let cancelled = false;
    loadPdf(url)
      .then(async (loaded) => {
        doc = loaded;
        const first = (await loaded.getPage(1)).getViewport({ scale: 1 });
        if (!cancelled) setPdf({ doc: loaded, ratio: first.width / first.height });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      void doc?.destroy();
    };
  }, [url]);

  return (
    <div
      ref={frame}
      dir="ltr"
      className="h-[80vh] overflow-y-auto rounded-sm border border-border bg-secondary/20 p-3 sm:p-6"
    >
      {pdf ? (
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {Array.from({ length: pdf.doc.numPages }, (_, i) => (
            <PdfPage key={i} doc={pdf.doc} number={i + 1} ratio={pdf.ratio} frame={frame} />
          ))}
        </div>
      ) : (
        <p className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
          {failed ? (
            isArabic ? (
              "تعذّر عرض المعاينة."
            ) : (
              "The preview couldn't be shown."
            )
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" aria-label={isArabic ? "تحميل" : "Loading"} />
          )}
        </p>
      )}
    </div>
  );
}

function PdfPage({
  doc,
  number,
  ratio,
  frame,
}: {
  doc: PdfDocument;
  number: number;
  ratio: number;
  frame: React.RefObject<HTMLDivElement | null>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const element = box.current;
    if (!element || drawn) return;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || !canvas.current) return;
        observer.disconnect();
        const page = await doc.getPage(number);
        const width = element.clientWidth * Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
        canvas.current.width = Math.ceil(viewport.width);
        canvas.current.height = Math.ceil(viewport.height);
        const context = canvas.current.getContext("2d");
        if (!context) return;
        await page.render({ canvasContext: context, viewport }).promise;
        page.cleanup();
        setDrawn(true);
      },
      // Starts a little ahead of the reader, so the next page is ready.
      { root: frame.current, rootMargin: "800px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [doc, number, frame, drawn]);

  return (
    <div
      ref={box}
      className="w-full overflow-hidden bg-white shadow-sm"
      style={drawn ? undefined : { aspectRatio: String(ratio) }}
    >
      <canvas ref={canvas} className="block h-auto w-full" />
    </div>
  );
}
