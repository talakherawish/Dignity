import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Search, X } from "lucide-react";
import { useState, useRef } from "react";
import logo from "@/assets/dignity-logo.png";
import { type Language, type TranslationKey, useLanguage } from "@/contexts/LanguageContext";

type Item = { labelKey: TranslationKey; to?: string; children?: Item[] };

const NAV: Item[] = [
  {
    labelKey: "about",
    children: [
      { labelKey: "about.initiative", to: "/about" },
      { labelKey: "about.mission", to: "/about/mission" },
      { labelKey: "about.fellows", to: "/about/participants" },
      { labelKey: "about.partners", to: "/about/partners" },
    ],
  },
  {
    labelKey: "projects",
    children: [{ labelKey: "projects.research", to: "/projects/research" }],
  },
  {
    labelKey: "activities",
    children: [
      { labelKey: "activities.seminars", to: "/activities/seminars" },
      { labelKey: "activities.conferences", to: "/activities/conferences" },
      { labelKey: "activities.meetings", to: "/activities/meetings" },
      { labelKey: "activities.windsor", to: "/activities/windsor-birzeit" },
    ],
  },
  {
    labelKey: "media",
    children: [
      { labelKey: "media.news", to: "/media/news" },
      { labelKey: "media.announcements", to: "/media/announcements" },
      { labelKey: "media.photos", to: "/media/photos" },
      { labelKey: "media.clippings", to: "/media/clippings" },
    ],
  },
];

const LANG_OPTIONS: { code: Language; label: string; ariaLabel: string }[] = [
  { code: "en", label: "EN", ariaLabel: "English" },
  { code: "ar", label: "ع", ariaLabel: "العربية" },
];

function SearchBar() {
  const { isArabic } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate({ to: "/search", search: { q: query.trim() } });
    handleClose();
  };

  return (
    <div className="relative flex items-center">
      {/* Search icon — always in layout, never moves */}
      <button
        onClick={open ? handleClose : handleOpen}
        aria-label={open ? "Close search" : "Open search"}
        className="p-2 text-muted-foreground hover:text-accent transition-colors"
      >
        {open ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
      </button>

      {/* Input overlays absolutely — zero layout impact */}
      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-50"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isArabic ? "ابحث..." : "Search..."}
            className={`w-52 sm:w-64 px-3 py-1.5 text-sm border border-border rounded-full bg-background shadow-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-all ${isArabic ? "text-right" : ""}`}
          />
        </form>
      )}
    </div>
  );
}

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center shrink-0 rounded-full border border-border bg-secondary/60 p-0.5 gap-0.5">
      {LANG_OPTIONS.map(({ code, label, ariaLabel }) => {
        const active = lang === code;
        return (
          <button
            key={code}
            aria-label={ariaLabel}
            onClick={() => setLang(code)}
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 select-none",
              code === "ar" ? "font-arabic tracking-normal" : "tracking-wide",
              active
                ? "bg-accent text-white shadow-sm scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function NavItem({ item }: { item: Item }) {
  const { t, isArabic } = useLanguage();
  const label = t(item.labelKey);

  if (!item.children) {
    return (
      <Link
        to={item.to!}
        activeOptions={{ exact: item.to === "/" }}
        className={[
          "px-2.5 py-2 font-medium text-foreground/80 hover:text-accent transition-colors data-[status=active]:text-accent whitespace-nowrap text-[13px]",
          isArabic ? "font-arabic" : "",
        ].join(" ")}
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="relative group shrink-0">
      <button
        className={[
          "px-2.5 py-2 font-medium text-foreground/80 hover:text-accent transition-colors inline-flex items-center gap-1 whitespace-nowrap text-[13px]",
          isArabic ? "font-arabic" : "",
        ].join(" ")}
      >
        {label}
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none group-hover:pointer-events-auto">
        <div className="min-w-56 bg-card border border-border rounded-md shadow-lg py-2 pointer-events-auto">
          {item.children.map((c) =>
            c.children ? (
              <div key={c.labelKey} className="relative group/sub">
                <button
                  className={[
                    "w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-accent flex items-center justify-between",
                    isArabic ? "font-arabic text-right flex-row-reverse" : "",
                  ].join(" ")}
                >
                  {t(c.labelKey)}
                  <ChevronDown className="h-3 w-3 -rotate-90 shrink-0" />
                </button>
                <div className="absolute left-full top-0 pl-1 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all z-[60] pointer-events-none group-hover/sub:pointer-events-auto">
                  <div className="min-w-48 bg-card border border-border rounded-md shadow-lg py-2 pointer-events-auto">
                    {c.children.map((s) => (
                      <Link
                        key={s.labelKey}
                        to={s.to!}
                        className={[
                          "block px-4 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-accent",
                          isArabic ? "font-arabic text-right" : "",
                        ].join(" ")}
                      >
                        {t(s.labelKey)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={c.labelKey}
                to={c.to!}
                className={[
                  "block px-4 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-accent",
                  isArabic ? "font-arabic text-right" : "",
                ].join(" ")}
              >
                {t(c.labelKey)}
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  return (
    /* dir="ltr" keeps the header layout fixed regardless of page language */
    <header dir="ltr" className="sticky top-0 z-40 bg-background border-b border-border">
      <div
        className="h-1"
        style={{
          background:
            "linear-gradient(90deg, var(--brand-cyan) 0%, var(--brand-cyan) 33%, var(--brand-magenta) 33%, var(--brand-magenta) 66%, oklch(0.18 0.01 270) 66%, oklch(0.18 0.01 270) 100%)",
        }}
      />
      {/* Full-width wrapper keeps the logo pinned to the far-left edge */}
      <div className="w-full">
        {/* px height keeps the header immune to html.lang-ar rem scaling */}
        <div
          className="grid grid-cols-[auto_1fr_auto] items-stretch"
          style={{ height: "100px" }}
        >
          {/* Logo block fills header height and stays flush left */}
          <Link
            to="/"
            className="flex items-stretch shrink-0 pl-0"
            style={{ height: "100px", gap: "12px", paddingInlineStart: "0px" }}
          >
            <img
              src={logo}
              alt="Dignity Initiative"
              style={{ height: "100%", width: "auto", display: "block" }}
              className="object-contain object-left"
            />
          </Link>

          {/* Nav — vertically centered in the row */}
          <nav className="flex items-center justify-center gap-0 overflow-visible self-center px-4 sm:px-6">
            {NAV.map((item) => (
              <NavItem key={item.labelKey} item={item} />
            ))}
          </nav>

          {/* Search + Language switcher — vertically centered */}
          <div className="self-center pr-4 sm:pr-6 lg:pr-8 flex items-center gap-3">
            <SearchBar />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
