import { Link } from "@tanstack/react-router";
import { BookOpen, Database, Facebook, Library, Mail, Twitter, Youtube } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const EXPLORE_LINKS = [
  { key: "about.initiative" as const, to: "/about" },
  { key: "projects.research" as const, to: "/projects/research" },
  { key: "activities.seminars" as const, to: "/activities/seminars" },
  { key: "media.news" as const, to: "/media/news" },
] as const;

const PARTICIPANT_LINKS = [
  { key: "about.faculty" as const, to: "/about/participants/faculty" },
  { key: "about.researchers" as const, to: "/about/participants/researchers" },
  { key: "about.students" as const, to: "/about/participants/students" },
  { key: "about.partners" as const, to: "/about/partners" },
] as const;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/35 font-semibold me-2">
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

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="font-serif text-lg font-semibold text-white mb-0.5">Dignity</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-white/35 mb-3">
            Academic Initiative
          </div>
          <p className="text-xs text-white/55 leading-relaxed">{t("footer.about")}</p>
        </div>

        {/* Explore */}
        <div>
          <h4 className="text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-3">
            {t("footer.explore")}
          </h4>
          <ul className="space-y-2">
            {EXPLORE_LINKS.map(({ key, to }) => (
              <li key={key}>
                <Link
                  to={to}
                  className="text-xs text-white/60 hover:text-[color:var(--brand-magenta)] transition-colors"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Participants */}
        <div>
          <h4 className="text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-3">
            {t("footer.participants")}
          </h4>
          <ul className="space-y-2">
            {PARTICIPANT_LINKS.map(({ key, to }) => (
              <li key={key}>
                <Link
                  to={to}
                  className="text-xs text-white/60 hover:text-[color:var(--brand-magenta)] transition-colors"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35 mb-3">
            {t("footer.contact")}
          </h4>
          <address className="not-italic space-y-1 text-xs text-white/60">
            <p className="font-semibold text-white/75 mb-1">{t("footer.university")}</p>
            <p>{t("footer.pobox")}</p>
            <p>{t("footer.zip")}</p>
            <p>{t("footer.phone")}</p>
            <p>{t("footer.fax")}</p>
            <a
              href="mailto:muwatin@birzeit.edu"
              className="block hover:text-[color:var(--brand-magenta)] transition-colors"
            >
              {t("footer.email")}
            </a>
          </address>
        </div>
      </div>

      {/* Subscribe + socials */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-white/60 whitespace-nowrap">
              {t("footer.subscribe")}
            </span>
            <form
              onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
              className="flex items-center gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("footer.subscribe.placeholder")}
                className="h-8 w-40 rounded-sm border border-white/20 bg-white/5 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[color:var(--brand-magenta)] transition-colors"
              />
              <button
                type="submit"
                className="h-8 px-3.5 rounded-sm bg-[color:var(--brand-magenta)] text-white text-xs font-medium hover:bg-[color:var(--brand-magenta)]/80 transition-colors shrink-0"
              >
                {t("footer.subscribe.btn")}
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2">
            {[
              { Icon: Facebook, label: "Facebook", href: "#" },
              { Icon: Twitter, label: "Twitter / X", href: "#" },
              { Icon: Youtube, label: "YouTube", href: "#" },
              { Icon: Mail, label: "Contact", href: "mailto:muwatin@birzeit.edu" },
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-white/35">{t("footer.copyright")}</p>
          <nav className="flex items-center gap-4">
            {[
              { key: "footer.disclaimer" as const, href: "#" },
              { key: "footer.privacy" as const, href: "#" },
              { key: "footer.sitemap" as const, href: "#" },
            ].map(({ key, href }) => (
              <a
                key={key}
                href={href}
                className="text-[10px] text-white/35 hover:text-white/60 transition-colors"
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
