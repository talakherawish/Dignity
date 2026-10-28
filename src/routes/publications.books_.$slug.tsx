import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { DownloadMenu } from "@/components/DownloadMenu";
import { PageLayout } from "@/components/PageLayout";
import { ParticipantLink } from "@/components/ParticipantModal";
import { PdfPreview } from "@/components/PdfPreview";
import { FormattedText } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatted,
  mediaSrcSet,
  mediaUrl,
  populated,
  resolveAttachment,
  type PayloadParticipant,
  type PayloadPublication,
} from "@/lib/payload";
import { bookQuery } from "@/lib/queries";
import { SECTION_COLORS } from "@/lib/sectionColors";

/**
 * A book's own page, opened from its card: the cover beside its details --
 * authors, publisher, place, year, edition, pages, ISBN -- and downloads, then
 * its description, then the book itself to read in the page (PdfPreview).
 *
 * "books_" rather than "books": the trailing underscore keeps this page from
 * nesting inside the Books listing's component.
 */
export const Route = createFileRoute("/publications/books_/$slug")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(bookQuery(params.slug));
  },
  component: BookPage,
});

function BookPage() {
  const { slug } = Route.useParams();
  const { t, isArabic } = useLanguage();
  const { data: book } = useQuery(bookQuery(slug));

  return (
    <PageLayout>
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <Link
          to="/publications/books"
          className="text-xs uppercase tracking-[0.18em] font-semibold hover:opacity-80"
          style={{ color: SECTION_COLORS.publications }}
        >
          {isArabic ? `→ ${t("publications.books")}` : `← ${t("publications.books")}`}
        </Link>
        {book ? (
          <Book book={book} />
        ) : (
          <p className="py-24 text-center text-muted-foreground">
            {isArabic ? "هذا الكتاب غير موجود." : "This book doesn't exist."}
          </p>
        )}
      </div>
    </PageLayout>
  );
}

function Book({ book }: { book: PayloadPublication }) {
  const { t, lang, isArabic } = useLanguage();
  const isAr = lang === "ar";
  const title = formatted(book, "title", isAr);
  const description = formatted(book, "description", isAr);
  const authors = populated<PayloadParticipant>(book.authorParticipants);
  const typedAuthor = isAr ? book.authorAr || book.author : book.author;
  const imageIsPhoto = book.image?.mimeType?.startsWith("image/") ?? false;
  const cover = imageIsPhoto ? book.image : (book.image?.thumbnail ?? book.file?.thumbnail);
  const file = resolveAttachment(book.file, book.fileAr, isAr).value;
  const fileUrl = mediaUrl(file);

  const details: [string, string | number | undefined][] = [
    [isArabic ? "الناشر" : "Publisher", isAr ? book.publisherAr || book.publisher : book.publisher],
    [isArabic ? "مكان النشر" : "Place", isAr ? book.placeAr || book.place : book.place],
    [isArabic ? "السنة" : "Year", book.date ? new Date(book.date).getFullYear() : undefined],
    [isArabic ? "الطبعة" : "Edition", book.edition],
    [isArabic ? "عدد الصفحات" : "Pages", book.pageCount],
    ["ISBN", book.isbn],
  ];

  return (
    <article className="mt-6">
      <div className="grid gap-10 md:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
        <div className="self-start overflow-hidden rounded-sm border border-border bg-secondary/20">
          {cover ? (
            <img
              src={mediaUrl(cover)}
              srcSet={mediaSrcSet(cover)}
              sizes="260px"
              alt=""
              className="block h-auto w-full"
            />
          ) : (
            <div className="flex aspect-[1/1.41] items-center justify-center">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="font-serif text-3xl leading-tight text-primary md:text-4xl">
            <FormattedText {...title} />
          </h1>
          {(authors.length > 0 || typedAuthor) && (
            <p className="mt-3 font-serif text-lg text-foreground/80">
              {authors.length > 0
                ? authors.map((person, index) => (
                    <span key={person.id}>
                      <ParticipantLink
                        id={person.id}
                        className="hover:text-accent hover:underline underline-offset-2"
                      >
                        {isAr ? person.nameAr || person.name : person.name}
                      </ParticipantLink>
                      {index < authors.length - 1 ? (isArabic ? "، " : ", ") : ""}
                    </span>
                  ))
                : typedAuthor}
            </p>
          )}

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {details
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-foreground" dir="auto">
                    {value}
                  </dd>
                </div>
              ))}
          </dl>

          {fileUrl && (
            <div className="mt-8">
              <DownloadMenu
                pill
                fileUrl={fileUrl}
                fileName={file?.filename}
                fileMimeType={file?.mimeType}
                fileSize={file?.filesize}
                otherFormats={book.otherFormats}
                label={t("publications.download")}
              />
            </div>
          )}
        </div>
      </div>

      {description.text && (
        <p
          dir="auto"
          className="mt-12 max-w-3xl whitespace-pre-line text-base leading-relaxed text-foreground/85"
        >
          <FormattedText {...description} />
        </p>
      )}

      {fileUrl && file?.mimeType === "application/pdf" && (
        <section className="mt-12">
          <h2 className="mb-6 font-serif text-2xl text-primary md:text-3xl">
            {isArabic ? "معاينة" : "Preview"}
          </h2>
          <PdfPreview url={fileUrl} />
        </section>
      )}
    </article>
  );
}
