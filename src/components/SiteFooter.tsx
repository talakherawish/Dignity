import { BookOpen, Database, Facebook, Library, Mail, Twitter, Youtube } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const RESOURCES = [
  { key: "footer.studying" as const, Icon: BookOpen },
  { key: "footer.library" as const, Icon: Library },
  { key: "footer.databases" as const, Icon: Database },
] as const;

export function SiteFooter() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");

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

      {/*
        Main grid — three balanced columns. The subscribe form + socials used to
        sit in their own full-width band below; folding them in here as a third
        column removes an entire horizontal band (shorter footer) and keeps the
        remaining content from looking sparse now that Explore/Participants are gone.
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {/* Brand */}
        <div>
          <div className="font-serif text-lg font-semibold text-white mb-0.5">Dignity</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-3">
            Academic Initiative
          </div>
          <p className="text-xs text-white/55 leading-relaxed max-w-xs">{t("footer.about")}</p>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-3">
            {t("footer.contact")}
          </h4>
          <address className="not-italic space-y-1 text-xs text-white/60">
            <p className="font-semibold text-white/75">{t("footer.university")}</p>
            <p>{t("footer.pobox")}</p>
            <p>{t("footer.zip")}</p>
            {/* Phone + fax share a row — they're short, and it keeps the block compact */}
            <p className="flex flex-wrap gap-x-3">
              <span>{t("footer.phone")}</span>
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
        <div className="sm:col-span-2 lg:col-span-1">
          <h4 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-3">
            {t("footer.subscribe")}
          </h4>
          <form
            onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
            className="flex items-center gap-2 max-w-xs"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("footer.subscribe.placeholder")}
              className="h-8 min-w-0 flex-1 rounded-sm border border-white/20 bg-white/5 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[color:var(--brand-magenta)] transition-colors"
            />
            <button
              type="submit"
              className="h-8 px-3.5 rounded-sm bg-[color:var(--brand-magenta)] text-white text-xs font-medium hover:bg-[color:var(--brand-magenta)]/80 transition-colors shrink-0"
            >
              {t("footer.subscribe.btn")}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-2">
            {[
              { Icon: Facebook, label: "Facebook", href: "#" },
              { Icon: Twitter, label: "Twitter / X", href: "#" },
              { Icon: Youtube, label: "YouTube", href: "https://www.youtube.com/@bzu-dignityinitiative6199" },
              { Icon: Mail, label: "Contact", href: "mailto:Dignity@birzeit.edu" },
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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
              { key: "footer.sitemap" as const, href: "#" },
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
    </footer>
  );
}
