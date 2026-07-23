import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { useState, useRef } from "react";
import logo from "@/assets/dignity-logo.png";
import { type Language, type TranslationKey, useLanguage } from "@/contexts/LanguageContext";

type Item = { labelKey: TranslationKey; to?: string; hash?: string; children?: Item[] };

const NAV: Item[] = [
  {
    labelKey: "about",
    children: [
      { labelKey: "about.initiative", to: "/about" },
      { labelKey: "about.mission", to: "/about", hash: "mission-vision" },
      { labelKey: "about.fellows", to: "/about/participants" },
      { labelKey: "media.news", to: "/media/news" },
      { labelKey: "media.announcements", to: "/media/announcements" },
      { labelKey: "media.photos", to: "/media/photos" },
      { labelKey: "media.clippings", to: "/media/clippings" },
      { labelKey: "about.partners", to: "/about/partners" },
    ],
  },
  {
    labelKey: "activities",
    children: [
      { labelKey: "activities.research", to: "/projects/research" },
      { labelKey: "activities.seminars", to: "/activities/seminars" },
      { labelKey: "activities.conferences", to: "/activities/conferences" },
      { labelKey: "activities.meetings", to: "/activities/meetings" },
      { labelKey: "activities.windsor", to: "/activities/windsor-birzeit" },
    ],
  },
  {
    labelKey: "publications",
    children: [
      { labelKey: "publications.books", to: "/publications/books" },
      { labelKey: "publications.papers", to: "/publications/papers" },
      { labelKey: "publications.reports", to: "/publications/reports" },
      { labelKey: "publications.brochures", to: "/publications/brochures" },
      { labelKey: "publications.theses", to: "/publications/theses" },
      { labelKey: "publications.audiovisual", to: "/publications/audiovisual" },
      { labelKey: "publications.posters", to: "/publications/posters" },
    ],
  },
  {
    labelKey: "information",
    children: [
      { labelKey: "information.readings", to: "/information/readings" },
      { labelKey: "information.databases", to: "/information/databases" },
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

      {/* Input overlays absolutely — zero layout impact.
          Anchored to the side that has open header space to grow into:
          in Arabic the search icon sits on the header's left edge, so the
          input expands rightward; in English it sits on the right edge, so
          it expands leftward. */}
      {open && (
        <form
          onSubmit={handleSubmit}
          className={`absolute ${isArabic ? "left-8" : "right-8"} top-1/2 -translate-y-1/2 z-50`}
        >
          <input
            ref={inputRef}
            type="text"
            dir={isArabic ? "rtl" : "ltr"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isArabic ? "ابحث..." : "Search..."}
            className={`w-44 sm:w-64 px-3.5 py-2 border border-border rounded-full bg-background shadow-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-all ${isArabic ? "font-arabic text-[15px] text-right" : "text-sm"}`}
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
          "px-2.5 py-2 font-medium text-foreground/80 hover:text-accent transition-colors data-[status=active]:text-accent whitespace-nowrap",
          isArabic ? "font-arabic text-[17px]" : "text-[15px]",
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
          "px-2.5 py-2 font-medium text-foreground/80 hover:text-accent transition-colors inline-flex items-center gap-1 whitespace-nowrap",
          isArabic ? "font-arabic text-[17px]" : "text-[15px]",
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
                hash={c.hash}
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

function MobileNav({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { t, isArabic } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div
      className="lg:hidden overflow-hidden border-t border-border bg-background"
      style={{
        maxHeight: open ? "80vh" : "0px",
        overflowY: open ? "auto" : "hidden",
        transition: "max-height 0.3s ease",
      }}
    >
      <nav className="px-4 py-2" dir={isArabic ? "rtl" : "ltr"}>
        {NAV.map((item) => (
          <div key={item.labelKey} className="border-b border-border last:border-b-0">
            {item.children ? (
              <>
                <button
                  onClick={() => setExpanded((cur) => (cur === item.labelKey ? null : item.labelKey))}
                  className={[
                    "w-full flex items-center justify-between py-3 font-medium text-foreground/80",
                    isArabic ? "font-arabic text-[16px]" : "text-[15px]",
                  ].join(" ")}
                >
                  {t(item.labelKey)}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform duration-200"
                    style={{ transform: expanded === item.labelKey ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: expanded === item.labelKey ? "600px" : "0px",
                    transition: "max-height 0.25s ease",
                  }}
                >
                  <div className={`pb-2 flex flex-col gap-0.5 ${isArabic ? "pr-3" : "pl-3"}`}>
                    {item.children.map((c) =>
                      c.children ? (
                        <div key={c.labelKey} className="py-1">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground/70 py-1">
                            {t(c.labelKey)}
                          </div>
                          <div className={isArabic ? "pr-3" : "pl-3"}>
                            {c.children.map((s) => (
                              <Link
                                key={s.labelKey}
                                to={s.to!}
                                onClick={onNavigate}
                                className="block py-2 text-sm text-foreground/75 hover:text-accent"
                              >
                                {t(s.labelKey)}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Link
                          key={c.labelKey}
                          to={c.to!}
                          hash={c.hash}
                          onClick={onNavigate}
                          className="block py-2 text-sm text-foreground/75 hover:text-accent"
                        >
                          {t(c.labelKey)}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </>
            ) : (
              <Link
                to={item.to!}
                onClick={onNavigate}
                className={[
                  "block py-3 font-medium text-foreground/80",
                  isArabic ? "font-arabic text-[16px]" : "text-[15px]",
                ].join(" ")}
              >
                {t(item.labelKey)}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}

export function SiteHeader() {
  const { isArabic } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div
        className="h-1"
        style={{
          background:
            "linear-gradient(90deg, var(--brand-cyan) 0%, var(--brand-cyan) 33%, var(--brand-magenta) 33%, var(--brand-magenta) 66%, oklch(0.18 0.01 270) 66%, oklch(0.18 0.01 270) 100%)",
        }}
      />
      {/* Full-width wrapper keeps the logo pinned to the leading edge */}
      <div className="w-full">
        {/*
          dir follows the active language: logo / nav / actions mirror to
          RTL in Arabic and stay LTR in English — nothing is locked anymore.
          Row height uses px-based arbitrary values (not rem) so it can't be
          shrunk/enlarged by the html.lang-ar scale, and shrinks responsively
          so the logo (a wide ~3:1 image) never forces the page wider than
          the viewport on mobile.
        */}
        <div
          dir={isArabic ? "rtl" : "ltr"}
          className="grid grid-cols-[auto_1fr_auto] items-stretch h-[64px] sm:h-[80px] lg:h-[101px]"
        >
          {/* Logo block fills header height and stays flush to the leading edge */}
          <Link to="/" className="flex items-stretch shrink-0 h-[64px] sm:h-[80px] lg:h-[101px]">
            <img
              src={logo}
              alt="Dignity Initiative"
              style={{ height: "100%", width: "auto", display: "block" }}
              className="object-contain"
            />
          </Link>

          {/* Desktop nav — vertically centered, hidden below lg to avoid overflow */}
          <nav className="hidden lg:flex items-center justify-center gap-0 overflow-visible self-center px-4 sm:px-6">
            {NAV.map((item) => (
              <NavItem key={item.labelKey} item={item} />
            ))}
          </nav>

          {/* Search + Language switcher + mobile menu toggle — vertically centered */}
          <div className="self-center pe-3 sm:pe-6 lg:pe-8 flex items-center gap-1.5 sm:gap-3">
            <SearchBar />
            <LanguageSwitcher />
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="lg:hidden p-2 text-foreground/80 hover:text-accent transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <MobileNav open={mobileOpen} onNavigate={() => setMobileOpen(false)} />
    </header>
  );
}
