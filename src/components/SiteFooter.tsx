import { BookOpen, Database, Facebook, Mail, Send, X, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { subscribeToMailingList } from "@/lib/payload";
// Reversed lockup: the black type and the black wedge of the disc are white,
// the cyan/magenta wedges and the Birzeit tree keep their colours, and the
// white plate behind the header version is transparent here.
import logoWhite from "@/assets/dignity-logo-white.png";

const PHONE_TEL_HREF = "tel:+97222982169";

const ADDRESS_MAP_LINK = "https://maps.app.goo.gl/XhiS7J5itvxw3mGy9";

const RESOURCES = [
  { key: "footer.studying" as const, to: "/information/readings" as const, Icon: BookOpen },
  { key: "footer.databases" as const, to: "/information/databases" as const, Icon: Database },
] as const;

const EMPTY_SUBSCRIBE_FORM = { firstName: "", lastName: "", email: "", phone: "" };

export function SiteFooter() {
  const { t, isArabic } = useLanguage();
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [form, setForm] = useState(EMPTY_SUBSCRIBE_FORM);

  function closeSubscribe() {
    setSubscribeOpen(false);
    setSubmitted(false);
    setSubmitting(false);
    setError(false);
    setForm(EMPTY_SUBSCRIBE_FORM);
  }

  // Bound to the document so Escape closes the modal from any focused field.
  useEffect(() => {
    if (!subscribeOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSubscribe();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [subscribeOpen]);

  // Manual fallback for when the automatic notification can't be trusted (or
  // just failed) -- a mailto: pre-filled with whatever the visitor has
  // typed so far, so they don't have to retype it in their own mail app.
  const mailtoHref = `mailto:Dignity@birzeit.edu?subject=${encodeURIComponent(
    "Mailing list signup",
  )}&body=${encodeURIComponent(
    `${form.firstName} ${form.lastName} would like to be added to the mailing list.\n\nEmail: ${form.email}\nPhone: ${form.phone}`,
  )}`;

  return (
    <footer className="border-t border-border bg-[var(--footer-bg)] text-primary-foreground">
      {/* Accent bar */}
      <div
        className="h-1"
        style={{
          background:
            "linear-gradient(90deg, var(--brand-cyan) 0%, var(--brand-cyan) 33%, var(--brand-magenta) 33%, var(--brand-magenta) 66%, var(--footer-bg) 66%, var(--footer-bg) 100%)",
        }}
      />

      {/* Mobile is one centered column: the two blocks below sit side by side
          from sm: up, but stacked on a phone a left-aligned contact block
          followed by a centered bottom bar reads as two different footers.
          Centring the stack (and separating the blocks with a hairline, since
          a gap alone doesn't say "new section" in a single column) makes the
          whole thing read as one. Everything reverts at sm:. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-7 grid gap-x-8 gap-y-6 sm:gap-y-7 sm:grid-cols-2">
        {/* The mark heads the footer the way the Muwatin conference footer
            opens, centred at every width -- over the single phone column, and
            over both desktop columns, which it spans. Centred rather than set
            to the leading edge, so it reads as the footer's own masthead
            instead of as a second copy of the header lockup.

            Slightly smaller on desktop (210px against the header's ~246px) so
            the two don't read as the same element printed twice down a page. */}
        <img
          src={logoWhite}
          alt="Dignity Initiative — Birzeit University"
          width={1200}
          height={492}
          className="mx-auto mb-1 h-auto w-full max-w-[240px] sm:col-span-2 sm:mb-0 sm:max-w-[210px]"
        />

        {/* Contact */}
        <div className="text-center sm:text-start">
          <h4 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-3">
            {t("footer.contact")}
          </h4>
          <address className="not-italic text-xs text-white/60 flex flex-col items-center gap-y-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-10 sm:gap-y-1">
            <a
              href={ADDRESS_MAP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block space-y-1 hover:text-[color:var(--brand-magenta)] transition-colors"
            >
              <p className="text-[13px] font-semibold text-white/75 sm:text-xs">
                {t("footer.university")}
              </p>
              {/* Street and postal lines share a row instead of stacking, so
                  the block is two lines rather than three. Both strings come
                  from Payload, so no length is guaranteed here -- each is kept
                  nowrap so that if the pair does outgrow the column they break
                  between the two parts rather than mid-address. */}
              <p>
                <span className="whitespace-nowrap">{t("footer.pobox")}</span>
                <span aria-hidden="true" className="mx-2 text-white/25">
                  ·
                </span>
                <span className="whitespace-nowrap">{t("footer.zip")}</span>
              </p>
            </a>
            <div className="space-y-1">
              {/* Phone + fax share a row — they're short, and it keeps the block
                  compact. Centred on mobile, where the row is the full column
                  width and would otherwise drift to the leading edge. */}
              <p className="flex flex-wrap justify-center gap-x-3 sm:justify-start">
                <a
                  href={PHONE_TEL_HREF}
                  className="hover:text-[color:var(--brand-magenta)] transition-colors"
                >
                  {t("footer.phone")}
                </a>
                <span>{t("footer.fax")}</span>
              </p>
              <a
                href="mailto:Dignity@birzeit.edu"
                className="block hover:text-[color:var(--brand-magenta)] transition-colors"
              >
                {t("footer.email")}
              </a>
            </div>
          </address>
        </div>

        {/* Stay in touch — subscribe + socials */}
        <div className="border-t border-white/10 pt-6 text-center sm:border-t-0 sm:pt-0 sm:text-start">
          <h4 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-3">
            {t("footer.subscribe")}
          </h4>
          {/* No max-width on a phone: the column is already only ~343px, and
              capping it at max-w-xs (320px) was pushing the last word of the
              Arabic line onto a second row for the sake of 23px. The cap
              stays from sm: up, where the column is wide enough that an
              uncapped line would run to an unreadable measure. */}
          <p className="text-xs text-white/55 leading-relaxed max-w-none mx-auto mb-4 sm:max-w-xs sm:mx-0 sm:mb-3">
            {t("footer.subscribe.desc")}
          </p>
          {/* flex-col-reverse on mobile: the socials come first in the DOM (they
              read as a quieter list beside the button at desktop widths), but
              stacked on a phone the Subscribe call to action belongs above
              them, not buried under a row of icons. */}
          <div className="flex flex-col-reverse items-center gap-4 sm:flex-row">
            <div className="flex items-center gap-3 sm:gap-2">
              {[
                {
                  Icon: Facebook,
                  label: "Facebook",
                  href: "https://www.facebook.com/dignity.initiative.bzu",
                },
                {
                  Icon: Youtube,
                  label: "YouTube",
                  href: "https://www.youtube.com/@bzu-dignityinitiative6199",
                },
                { Icon: Mail, label: "Contact", href: "mailto:Dignity@birzeit.edu" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  {...(href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/45 hover:text-white hover:border-white/35 transition-all sm:h-8 sm:w-8"
                >
                  <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </a>
              ))}
            </div>
            {/* Full width and a 44px-tall tap target on mobile; back to the
                inline chip beside the socials from sm: up. */}
            <button
              type="button"
              onClick={() => setSubscribeOpen(true)}
              className="shrink-0 inline-flex w-full items-center justify-center gap-2 h-11 px-4 rounded-sm bg-[color:var(--brand-magenta)] text-white text-xs font-medium hover:bg-[color:var(--brand-magenta)]/80 transition-colors sm:w-auto sm:h-9 sm:justify-start"
            >
              <Send className="h-3.5 w-3.5" />
              {t("footer.subscribe.btn")}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar: copyright | resources | disclaimer & privacy. The last
          thing in the footer, under the contact and subscribe columns, which
          is where a reader looks for a copyright line and a privacy link. It
          used to sit above them, at the top of the footer, where it read as a
          second navigation strip rather than as the end of the page. Its rule
          is a border-t for the same reason: it divides itself from the block
          above rather than from the page below.

          Stacked in a single centered column on mobile -- three flex-wrap
          items with justify-between look tidy at desktop widths, but once
          the middle (resources) block is forced to its own wrapped line by
          min-w-[220px], the other two land on opposite ends of a line that
          no longer has a middle item to justify against, reading as
          scattered rather than stacked. Row layout (and the resources
          block's own flex-1 growth within it) only kicks back in at sm:.

          The mobile stack runs resources -> copyright -> legal links, so the
          two quietest lines finish the page together instead of the
          copyright trailing after the links. */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-3 flex flex-col items-center gap-4 text-center sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:text-start">
          <p className="text-[12px] text-white/35 shrink-0 order-2 sm:order-none">
            {t("footer.copyright")}
          </p>

          {/* On mobile the label gets its own line above the two links, which
              become proper tap targets side by side -- the wrapper below is
              display:contents from sm: up, so at desktop widths the label and
              both links are still direct children of this one flex row. */}
          <div className="order-1 flex w-full flex-col items-center gap-2.5 min-w-[220px] sm:order-none sm:w-auto sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2">
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.18em] text-white/35 font-semibold sm:me-2">
              {t("footer.resources")}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:contents">
              {RESOURCES.map(({ key, to, Icon }) => (
                <Link
                  key={key}
                  to={to}
                  className="group flex items-center gap-1.5 rounded-sm border border-white/10 bg-white/5 px-3 py-2 text-white/60 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white/90 sm:gap-2 sm:px-3.5"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-white/55 transition-colors group-hover:text-[color:var(--brand-magenta)]" />
                  <span className="text-[12px] font-medium transition-colors whitespace-nowrap sm:text-xs">
                    {t(key)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <nav className="order-3 flex items-center gap-4 shrink-0 sm:order-none">
            <Link
              to="/disclaimer"
              className="text-[12px] text-white/35 hover:text-white/60 transition-colors"
            >
              {t("footer.disclaimer")}
            </Link>
            <Link
              to="/privacy"
              className="text-[12px] text-white/35 hover:text-white/60 transition-colors"
            >
              {t("footer.privacy")}
            </Link>
          </nav>
        </div>
      </div>

      {subscribeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeSubscribe}
          role="dialog"
          aria-modal="true"
          aria-label={t("footer.subscribe.modalTitle")}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-md bg-card text-card-foreground shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
              <div>
                <h3 className="font-serif text-lg font-semibold">
                  {t("footer.subscribe.modalTitle")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("footer.subscribe.modalDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSubscribe}
                aria-label={isArabic ? "إغلاق" : "Close"}
                className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitted ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm font-medium">{t("footer.subscribe.success")}</p>
                <a
                  href={mailtoHref}
                  className="mt-2 inline-block text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground transition-colors"
                >
                  {t("footer.subscribe.mailtoFallback")}
                </a>
                <button
                  type="button"
                  onClick={closeSubscribe}
                  className="mt-4 block mx-auto h-9 px-4 rounded-sm bg-[color:var(--brand-magenta)] text-white text-xs font-medium hover:bg-[color:var(--brand-magenta)]/80 transition-colors"
                >
                  {isArabic ? "إغلاق" : "Close"}
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(false);
                  setSubmitting(true);
                  subscribeToMailingList(form)
                    .then(() => setSubmitted(true))
                    .catch(() => setError(true))
                    .finally(() => setSubmitting(false));
                }}
                className="px-6 py-5 space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                      {t("footer.subscribe.firstName")}
                    </span>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="h-9 w-full rounded-sm border border-input bg-transparent px-3 text-sm focus:outline-none focus:border-[color:var(--brand-magenta)] transition-colors"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                      {t("footer.subscribe.lastName")}
                    </span>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="h-9 w-full rounded-sm border border-input bg-transparent px-3 text-sm focus:outline-none focus:border-[color:var(--brand-magenta)] transition-colors"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                    {t("footer.subscribe.email")}
                  </span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder={t("footer.subscribe.placeholder")}
                    className="h-9 w-full rounded-sm border border-input bg-transparent px-3 text-sm focus:outline-none focus:border-[color:var(--brand-magenta)] transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                    {t("footer.subscribe.phone")}
                  </span>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="h-9 w-full rounded-sm border border-input bg-transparent px-3 text-sm focus:outline-none focus:border-[color:var(--brand-magenta)] transition-colors"
                  />
                </label>
                {error && (
                  <p className="text-xs text-destructive">
                    {t("footer.subscribe.error")}{" "}
                    <a href={mailtoHref} className="underline decoration-dotted underline-offset-2">
                      {t("footer.subscribe.mailtoFallback")}
                    </a>
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 w-full rounded-sm bg-[color:var(--brand-magenta)] text-white text-xs font-medium hover:bg-[color:var(--brand-magenta)]/80 transition-colors disabled:opacity-60"
                >
                  {submitting ? t("footer.subscribe.sending") : t("footer.subscribe.btn")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
