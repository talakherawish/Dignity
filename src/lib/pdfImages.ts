/**
 * "Download as images" for a publication's PDF, done in the reader's browser:
 * each page is drawn by pdf.js (Mozilla's PDF renderer) and saved as a PNG --
 * one image for a one-page poster, a zip with one image per page otherwise.
 * Nothing is made or stored ahead of time and the server does no work; both
 * libraries load only when someone asks for images.
 *
 * Long documents stop at MAX_PAGES: a whole book as images is a huge zip that
 * nobody wants, and the name of the zip says which pages it holds.
 */

const MAX_PAGES = 20;
/** About print quality for a poster, without making a phone run out of memory. */
const MAX_WIDTH_PX = 2400;
const SCALE = 2;

/** The file's own name without its extension, for naming what is saved. */
function baseName(url: string): string {
  const last = decodeURIComponent(new URL(url, location.href).pathname.split("/").pop() ?? "");
  return last.replace(/\.pdf$/i, "") || "publication";
}

function save(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export async function downloadPdfAsImages(
  url: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const [pdfjs, { default: workerUrl }, { zipSync }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    import("fflate"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const pdf = await pdfjs.getDocument({ url }).promise;
  const pageCount = pdf.numPages;
  const total = Math.min(pageCount, MAX_PAGES);
  const name = baseName(url);
  const pages: Record<string, Uint8Array> = {};
  let single: Blob | undefined;

  try {
    for (let n = 1; n <= total; n++) {
      onProgress?.(n - 1, total);
      const page = await pdf.getPage(n);
      const natural = page.getViewport({ scale: 1 });
      const scale = Math.min(SCALE, MAX_WIDTH_PX / natural.width);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No canvas");
      // PDFs with no background of their own come out transparent otherwise.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image"))), "image/png"),
      );
      page.cleanup();
      if (total === 1) single = blob;
      else
        pages[`${name}-page-${String(n).padStart(2, "0")}.png`] = new Uint8Array(
          await blob.arrayBuffer(),
        );
    }
    onProgress?.(total, total);
  } finally {
    await pdf.destroy();
  }

  if (single) {
    save(single, `${name}.png`);
    return;
  }
  // PNGs are already compressed; storing them as they are is faster than
  // squeezing them again for next to nothing.
  const zip = zipSync(pages, { level: 0 });
  const range = pageCount > MAX_PAGES ? `-pages-1-${MAX_PAGES}` : "";
  save(
    new Blob([zip as Uint8Array<ArrayBuffer>], { type: "application/zip" }),
    `${name}${range}.zip`,
  );
}
