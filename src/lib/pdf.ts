/**
 * pdf.js (Mozilla's PDF renderer), loaded only when a PDF is actually drawn
 * in the browser -- a book's preview, or a download as images -- so no other
 * page carries it.
 */
export async function loadPdf(url: string) {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs.getDocument({ url }).promise;
}

export type PdfDocument = Awaited<ReturnType<typeof loadPdf>>;
