import { BookOpen, Database, Facebook, Mail, Send, X, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { subscribeToMailingList } from "@/lib/payload";

const PHONE_TEL_HREF = "tel:+97222982169";

const ADDRESS_MAP_LINK = "https://maps.app.goo.gl/XhiS7J5itvxw3mGy9";

const RESOURCES = [
  { key: "footer.studying" as const, Icon: BookOpen },
  { key: "footer.databases" as const, Icon: Database },
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
    <footer className="border-t border-border bg-primary text-primary-foreground">
      {/* Accent bar */}
      <div
        className="h-1"
        style={{
          background:
            "linear-gradient(90deg, var(--brand-cyan) 0%, var(--brand-cyan) 33%, var(--brand-magenta) 33%, var(--brand-magenta) 66%, oklch(0.35 0.01 270) 66%, oklch(0.35 0.01 270) 100%)",
        }}
      />

      {/* Resources bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[12px] uppercase tracking-[0.18em] text-white/35 font-semibold me-2">
              {t("footer.resources")}
            </span>
            {RESOURCES.map(({ key, Icon }) => (
              <a
                key={key}
                href="#"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <Icon className="h-3.5 w-3.5 text-white/55 group-hover:text-[color:var(--brand-magenta)] transition-colors shrink-0" />
                <span className="text-xs font-medium text-white/60 group-hover:text-white/90 transition-colors whitespace-nowrap">
                  {t(key)}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 grid gap-x-8 gap-y-7 sm:grid-cols-2">
        {/* Contact */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-3">
            {t("footer.contact")}
          </h4>
          <address className="not-italic space-y-1 text-xs text-white/60">
            <a
              href={ADDRESS_MAP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-[color:var(--brand-magenta)] transition-colors"
            >
              <p className="font-semibold text-white/75">{t("footer.university")}</p>
              <p>{t("footer.pobox")}</p>
              <p>{t("footer.zip")}</p>
            </a>
            {/* Phone + fax share a row — they're short, and it keeps the block compact */}
            <p className="flex flex-wrap gap-x-3">
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
          </address>
        </div>

        {/* Stay in touch — subscribe + socials */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-3">
            {t("footer.subscribe")}
          </h4>
          <p className="text-xs text-white/55 leading-relaxed max-w-xs mb-3">
            {t("footer.subscribe.desc")}
          </p>
          <button
            type="button"
            onClick={() => setSubscribeOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-sm bg-[color:var(--brand-magenta)] text-white text-xs font-medium hover:bg-[color:var(--brand-magenta)]/80 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            {t("footer.subscribe.btn")}
          </button>

          <div className="mt-4 flex items-center gap-2">
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/45 hover:text-white hover:border-white/35 transition-all"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-white/35">{t("footer.copyright")}</p>
          <nav className="flex items-center gap-4">
            {[
              { key: "footer.disclaimer" as const, href: "#" },
              { key: "footer.privacy" as const, href: "#" },
            ].map(({ key, href }) => (
              <a
                key={key}
                href={href}
                className="text-[12px] text-white/35 hover:text-white/60 transition-colors"
              >
                {t(key)}
              </a>
            ))}
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
