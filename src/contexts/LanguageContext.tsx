import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { persistLanguage } from "@/lib/language-preference";
import { siteSettingsQuery } from "@/lib/queries";

export type Language = "en" | "ar";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  /**
   * Like t, but for wording an editor can leave blank in Site Settings to take
   * it off the page (the eyebrows): blank there gives "". The built-in wording
   * is only used if Site Settings couldn't be loaded at all.
   */
  tOptional: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
  isArabic: boolean;
}

const translations = {
  en: {
    // NAV
    home: "Home",
    about: "About the Dignity Initiative",
    "about.initiative": "The Dignity Research Initiative",
    "about.participants": "Working Group",
    "about.partners": "Partners",
    projects: "Projects",
    "projects.research": "Research Projects",
    activities: "Activities",
    "activities.forums": "Forums",
    "activities.windsor": "The Windsor Birzeit Dignity Initiative",
    "activities.ideaFactory": "Idea Factory",
    "activities.taskForceAI": "Task Force on AI",
    "forums.filter.all": "All",
    "forums.filter.seminar": "Seminars",
    "forums.filter.roundtable": "Roundtables",
    "forums.filter.workshop": "Workshops",
    "forums.filter.conference": "Conferences",
    "forums.filter.encounters": "Encounters",
    "forums.type.seminar": "Seminar",
    "forums.type.roundtable": "Roundtable",
    "forums.type.workshop": "Workshop",
    "forums.type.conference": "Conference",
    "forums.type.encounters": "Encounters",
    "forums.empty": "No forum events published yet.",
    "forums.additionalInfo": "Additional Information",
    "forums.participants": "Participants",
    "media.news": "News & Announcements",
    "media.photos": "Photos",
    "media.clippings": "Clippings",
    "activities.research": "Research Projects",
    publications: "Publications",
    "publications.books": "Books",
    "publications.papers": "Papers",
    "publications.reports": "Reports",
    "publications.brochures": "Brochures",
    "publications.theses": "Theses",
    "publications.audiovisual": "Audiovisual",
    "publications.posters": "Posters",
    "publications.stickers": "Stickers & Bookmarks",
    "publications.page.desc":
      "Books, papers, reports, and other publications produced by the Dignity initiative.",
    "publications.empty": "No publications available yet.",
    "publications.download": "Download",
    "publications.view": "View",
    "publications.watchOnYoutube": "Watch on YouTube",
    information: "Information",
    "information.readings": "Readings and Documents",
    "information.databases": "Databases",
    "information.page.desc":
      "Readings, documents, and databases relevant to the Dignity initiative's research.",
    "citation.copy": "Copy citation",
    "citation.style": "Citation style",
    "translate.onlyEnglish": "Only available in English.",
    "translate.onlyArabic": "Only available in Arabic.",
    "translate.auto": "Translate automatically",
    "translate.machine":
      "Machine translation, not by the Dignity Initiative. It may contain errors.",
    "translate.failed": "Couldn't translate right now.",
    "citation.copyWithAnnotation": "Copy with annotation",
    "citation.copied": "Copied",
    "citation.failed": "Couldn't copy",
    "readings.empty": "No subjects published yet.",
    "readings.itemsEmpty": "No readings published in this subject yet.",
    "readings.count": "readings",
    "readings.search": "Search titles, authors, sources, notes, keywords",
    "readings.noMatches": "No readings match these filters.",
    "readings.back": "All subjects",
    "readings.alsoIn.en": "Also in English",
    "readings.alsoIn.ar": "Also in Arabic",
    "readings.type.book": "Book",
    "readings.type.bookChapter": "Book chapter",
    "readings.type.article": "Article",
    "readings.type.report": "Report",
    "readings.type.document": "Document",
    "readings.type.thesis": "Thesis",
    "readings.type.video": "Video",
    "readings.type.website": "Website",
    "readings.type.other": "Other",
    "databases.entries": "entries",
    "databases.empty": "No databases published yet.",
    "databases.entriesEmpty": "No entries published in this database yet.",
    "databases.search": "Search titles, authors, keywords, annotations",
    "databases.filter.type": "Type",
    "databases.filter.author": "Author",
    "databases.filter.keyword": "Keyword",
    "databases.filter.language": "Language",
    "databases.filter.any": "Any",
    "databases.filter.clear": "Clear filters",
    "databases.showing": "Showing",
    "databases.of": "of",
    "databases.noMatches": "No entries match these filters.",
    "databases.keywords": "Keywords",
    "databases.source": "Go to source",
    "databases.annotation": "Annotation",
    "databases.back": "All databases",
    "databases.lang.en": "English",
    "databases.lang.ar": "Arabic",
    "databases.lang.other": "Other",
    "databases.type.book": "Book",
    "databases.type.bookChapter": "Book chapter",
    "databases.type.journalArticle": "Journal article",
    "databases.type.otherArticle": "Article",
    "databases.type.report": "Report",
    "databases.type.thesis": "Thesis",
    "databases.type.website": "Website",
    "databases.type.other": "Other",
    "partners.empty": "No partners published yet.",
    "partners.visitSite": "Visit website",
    // HOME
    "hero.eyebrow": "Academic Initiative",
    "hero.title": "Advancing scholarship in service of human dignity",
    "hero.desc":
      "Dignity brings together faculty, researchers, students, and partners to pursue rigorous inquiry, foster dialogue, and produce work of lasting public value.",
    "posters.title": "A look at our publications",
    "posters.viewAll": "View All",
    "news.title": "Latest News and Announcements",
    "news.viewAll": "View all →",
    "news.readMore": "Read more",
    "news.collapse": "Collapse",
    "content.untranslated":
      "This text is not available in English yet. A translation is on the way.",
    // FOOTER
    "footer.contact": "Contact",
    "footer.university": "Birzeit University",
    "footer.pobox": "Room 5, Graduate Studies Building",
    "footer.zip": "P. O. Box 14, Birzeit, Palestine",
    "footer.phone": "Phone: +972 (2) 2982169",
    "footer.fax": "Fax: +972 (2) 2982168",
    "footer.email": "Email: Dignity@birzeit.edu",
    "footer.subscribe": "Subscribe to mailing list",
    "footer.subscribe.desc": "Get updates on new research, events, and publications.",
    "footer.subscribe.placeholder": "Your email address",
    "footer.subscribe.btn": "Subscribe",
    "footer.subscribe.modalTitle": "Subscribe to our mailing list",
    "footer.subscribe.modalDesc": "Get updates on new research, events, and publications.",
    "footer.subscribe.firstName": "First name",
    "footer.subscribe.lastName": "Last name",
    "footer.subscribe.email": "Email",
    "footer.subscribe.phone": "Phone number",
    "footer.subscribe.success": "Thanks for subscribing!",
    "footer.subscribe.sending": "Subscribing...",
    "footer.subscribe.error": "Something went wrong. Please try again.",
    "footer.subscribe.mailtoFallback": "Email us directly instead",
    "footer.disclaimer": "Disclaimer",
    "footer.privacy": "Privacy Policy",
    "footer.copyright": "Copyright © Muwatin Institute for Democracy and Human Rights, 2019–2026.",
    "footer.resources": "Resources",
    "footer.studying": "Studying Materials",
    "footer.databases": "Databases",
    // TEAM SECTION
    "team.eyebrow": "Meet the Participants",
    "team.title": "People driving our mission",
    "team.btn": "View All",
  },

  ar: {
    // NAV
    home: "الرئيسية",
    about: "عن مبادرة كرامة",
    "about.initiative": "مبادرة كرامة البحثية",
    "about.participants": "مجموعة العمل",
    "about.partners": "الشركاء",
    projects: "المشاريع",
    "projects.research": "المشاريع البحثية",
    activities: "ﻧﺸﺎطﺎت",
    "activities.forums": "منتديات",
    "activities.windsor": "مبادرة وندسور بيرزيت للكرامة",
    "activities.ideaFactory": "معمل الأفكار",
    "activities.taskForceAI": "مجموعة العمل حول الذكاء الاصطناعي",
    "forums.filter.all": "الكل",
    "forums.filter.seminar": "ندوات",
    "forums.filter.roundtable": "طاولات مستديرة",
    "forums.filter.workshop": "ورش عمل",
    "forums.filter.conference": "مؤتمرات",
    "forums.filter.encounters": "حواريات",
    "forums.type.seminar": "ندوة",
    "forums.type.roundtable": "طاولة مستديرة",
    "forums.type.workshop": "ورشة عمل",
    "forums.type.conference": "مؤتمر",
    "forums.type.encounters": "حواريات",
    "forums.empty": "لا توجد فعاليات منتدى منشورة حالياً.",
    "forums.additionalInfo": "معلومات إضافية",
    "forums.participants": "المشاركون",
    "media.news": "الأخبار والإعلانات",
    "media.photos": "صور",
    "media.clippings": "قصاصات",
    "activities.research": "المشاريع البحثية",
    publications: "المنشورات",
    "publications.books": "كتب",
    "publications.papers": "أوراق بحثية",
    "publications.reports": "تقارير",
    "publications.brochures": "بروشورات",
    "publications.theses": "رسائل الماجستير",
    "publications.audiovisual": "مرئي مسموع",
    "publications.posters": "لوحات جداريّة",
    "publications.stickers": "ملصقات وفواصل كتب",
    "publications.page.desc":
      "كتب وأوراق بحثية وتقارير وغيرها من المنشورات الصادرة عن مبادرة الكرامة.",
    "publications.empty": "لا توجد منشورات متاحة حالياً.",
    "publications.download": "تحميل",
    "publications.view": "عرض",
    "publications.watchOnYoutube": "مشاهدة على يوتيوب",
    information: "معلومات",
    "information.readings": "قراءات ووثائق",
    "information.databases": "قواعد معلومات",
    "information.page.desc": "قراءات ووثائق وقواعد معلومات ذات صلة بأبحاث مبادرة الكرامة.",
    "citation.copy": "نسخ التوثيق",
    "citation.style": "أسلوب التوثيق",
    "translate.onlyEnglish": "متوفر بالإنجليزية فقط.",
    "translate.onlyArabic": "متوفر بالعربية فقط.",
    "translate.auto": "ترجمة آلية",
    "translate.machine": "ترجمة آلية، ليست من مبادرة كرامة، وقد تحتوي على أخطاء.",
    "translate.failed": "تعذّرت الترجمة الآن.",
    "citation.copyWithAnnotation": "نسخ مع الملخص",
    "citation.copied": "تم النسخ",
    "citation.failed": "تعذّر النسخ",
    "readings.empty": "لا توجد مواضيع منشورة حالياً.",
    "readings.itemsEmpty": "لا توجد قراءات منشورة في هذا الموضوع حالياً.",
    "readings.count": "قراءات",
    "readings.search": "ابحث في العناوين والمؤلفين والمصادر والملاحظات والكلمات المفتاحية",
    "readings.noMatches": "لا توجد قراءات مطابقة لهذه الفلاتر.",
    "readings.back": "جميع المواضيع",
    "readings.alsoIn.en": "متوفر أيضاً بالإنجليزية",
    "readings.alsoIn.ar": "متوفر أيضاً بالعربية",
    "readings.type.book": "كتاب",
    "readings.type.bookChapter": "فصل في كتاب",
    "readings.type.article": "مقالة",
    "readings.type.report": "تقرير",
    "readings.type.document": "وثيقة",
    "readings.type.thesis": "رسالة جامعية",
    "readings.type.video": "فيديو",
    "readings.type.website": "موقع إلكتروني",
    "readings.type.other": "أخرى",
    "databases.entries": "مدخلات",
    "databases.empty": "لا توجد قواعد معلومات منشورة حالياً.",
    "databases.entriesEmpty": "لا توجد مدخلات منشورة في قاعدة المعلومات هذه حالياً.",
    "databases.search": "ابحث في العناوين والمؤلفين والكلمات المفتاحية والملخصات",
    "databases.filter.type": "النوع",
    "databases.filter.author": "المؤلف",
    "databases.filter.keyword": "كلمة مفتاحية",
    "databases.filter.language": "اللغة",
    "databases.filter.any": "الكل",
    "databases.filter.clear": "مسح الفلاتر",
    "databases.showing": "عرض",
    "databases.of": "من",
    "databases.noMatches": "لا توجد مدخلات تطابق هذه الفلاتر.",
    "databases.keywords": "كلمات مفتاحية",
    "databases.source": "الانتقال إلى المصدر",
    "databases.annotation": "الملخص",
    "databases.back": "جميع قواعد المعلومات",
    "databases.lang.en": "الإنجليزية",
    "databases.lang.ar": "العربية",
    "databases.lang.other": "أخرى",
    "databases.type.book": "كتاب",
    "databases.type.bookChapter": "فصل في كتاب",
    "databases.type.journalArticle": "مقالة في مجلة علمية",
    "databases.type.otherArticle": "مقالة",
    "databases.type.report": "تقرير",
    "databases.type.thesis": "رسالة جامعية",
    "databases.type.website": "موقع إلكتروني",
    "databases.type.other": "أخرى",
    "partners.empty": "لا توجد جهات شريكة منشورة حالياً.",
    "partners.visitSite": "زيارة الموقع",
    // HOME
    "hero.eyebrow": "مبادرة أكاديمية",
    "hero.title": "تعزيز المعرفة في خدمة الكرامة الإنسانية",
    "hero.desc":
      "تجمع مبادرة الكرامة أعضاء هيئة التدريس والباحثين والطلاب والشركاء لمتابعة البحث الصارم وتعزيز الحوار وإنتاج أعمال ذات قيمة عامة دائمة.",
    "posters.title": "لمحة عن منشوراتنا",
    "posters.viewAll": "عرض الكل",
    "news.title": "آخر الأخبار والإعلانات",
    "news.viewAll": "← عرض الكل",
    "news.readMore": "اقرأ المزيد",
    "news.collapse": "طيّ",
    "content.untranslated": "هذا النص غير متوفر بالعربية بعد، والترجمة قيد الإعداد.",
    // FOOTER
    "footer.contact": "اتصل بنا",
    "footer.university": "جامعة بيرزيت",
    "footer.pobox": "غرفة 5، مبنى الدراسات العليا",
    "footer.zip": "ص.ب. 14، بيرزيت، فلسطين",
    "footer.phone": "هاتف: +972 (2) 2982169",
    "footer.fax": "فاكس: +972 (2) 2982168",
    "footer.email": "البريد الإلكتروني: Dignity@birzeit.edu",
    "footer.subscribe": "اشترك في القائمة البريدية",
    "footer.subscribe.desc": "احصل على آخر التحديثات حول الأبحاث والفعاليات والمنشورات الجديدة.",
    "footer.subscribe.placeholder": "عنوان بريدك الإلكتروني",
    "footer.subscribe.btn": "اشترك",
    "footer.subscribe.modalTitle": "اشترك في قائمتنا البريدية",
    "footer.subscribe.modalDesc":
      "احصل على آخر التحديثات حول الأبحاث والفعاليات والمنشورات الجديدة.",
    "footer.subscribe.firstName": "الاسم الأول",
    "footer.subscribe.lastName": "اسم العائلة",
    "footer.subscribe.email": "البريد الإلكتروني",
    "footer.subscribe.phone": "رقم الهاتف",
    "footer.subscribe.success": "شكراً لاشتراكك!",
    "footer.subscribe.sending": "جارٍ الاشتراك...",
    "footer.subscribe.error": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    "footer.subscribe.mailtoFallback": "راسلنا مباشرة بدلاً من ذلك",
    "footer.disclaimer": "إخلاء المسؤولية",
    "footer.privacy": "سياسة الخصوصية",
    "footer.copyright": "حقوق النشر © معهد مواطن للديمقراطية وحقوق الإنسان، 2019–2026.",
    "footer.resources": "الموارد",
    "footer.studying": "المواد الدراسية",
    "footer.databases": "قواعد البيانات",
    // TEAM SECTION
    "team.eyebrow": "تعرف على المشاركين",
    "team.title": "الأشخاص الذين يقودون مهمتنا",
    "team.btn": "عرض الكل",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// Maps translation keys to the corresponding Site Settings field name (English base;
// the Arabic value lives at `${base}Ar`). Only keys editable via Payload appear here --
// anything absent falls back to the hardcoded dictionary above untouched.
const SITE_SETTINGS_KEY_MAP: Partial<Record<TranslationKey, string>> = {
  // Listed in the order the menus appear in SiteHeader's NAV, so a field in the
  // admin can be traced to a place on the site. Every nav label belongs here --
  // a key that is missing is one an editor cannot reach.
  about: "navAbout",
  "about.initiative": "navAboutInitiative",
  "about.participants": "navAboutFellows",
  "media.news": "navMediaNews",
  "media.photos": "navMediaPhotos",
  "media.clippings": "navMediaClippings",
  "about.partners": "navAboutPartners",

  activities: "navActivities",
  // Still called navProjectsResearch in Payload, from when this link lived under
  // a "Projects" menu -- renaming the field would strand the saved wording.
  "activities.research": "navProjectsResearch",
  "activities.forums": "navActivitiesForums",
  "activities.windsor": "navActivitiesWindsor",
  "activities.ideaFactory": "navActivitiesIdeaFactory",
  "activities.taskForceAI": "navActivitiesTaskForceAI",

  publications: "navPublications",
  "publications.books": "navPublicationsBooks",
  "publications.papers": "navPublicationsPapers",
  "publications.reports": "navPublicationsReports",
  "publications.brochures": "navPublicationsBrochures",
  "publications.theses": "navPublicationsTheses",
  "publications.audiovisual": "navPublicationsAudiovisual",
  "publications.posters": "navPublicationsPosters",
  // Still called navAboutStickers in Payload, from when this link lived under
  // the About menu -- renaming the field would strand the saved wording.
  "publications.stickers": "navAboutStickers",

  information: "navInformation",
  "information.readings": "navInformationReadings",
  "information.databases": "navInformationDatabases",

  "hero.eyebrow": "heroEyebrow",
  "hero.title": "heroTitle",
  "hero.desc": "heroDesc",
  "news.title": "newsTitle",
  "news.viewAll": "newsViewAll",
  "posters.title": "postersTitle",
  "posters.viewAll": "postersViewAll",
  "news.readMore": "newsReadMore",
  "news.collapse": "newsCollapse",
  "content.untranslated": "contentUntranslated",
  "forums.filter.all": "forumFilterAll",
  "forums.type.seminar": "forumTypeSeminar",
  "forums.type.roundtable": "forumTypeRoundtable",
  "forums.type.workshop": "forumTypeWorkshop",
  "forums.type.conference": "forumTypeConference",
  "forums.type.encounters": "forumTypeEncounters",

  "footer.contact": "footerContact",
  "footer.university": "footerUniversity",
  "footer.pobox": "footerPobox",
  "footer.zip": "footerZip",
  "footer.phone": "footerPhone",
  "footer.fax": "footerFax",
  "footer.email": "footerEmail",
  "footer.subscribe": "footerSubscribe",
  "footer.subscribe.placeholder": "footerSubscribePlaceholder",
  "footer.subscribe.btn": "footerSubscribeBtn",
  "footer.disclaimer": "footerDisclaimer",
  "footer.privacy": "footerPrivacy",
  "footer.copyright": "footerCopyright",
  "footer.resources": "footerResources",
  "footer.studying": "footerStudying",
  "footer.databases": "footerDatabases",

  "team.eyebrow": "teamEyebrow",
  "team.title": "teamTitle",
  "team.btn": "teamBtn",
};

const LanguageContext = createContext<LanguageContextValue>({} as LanguageContextValue);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  /**
   * Resolved once in the root route's loader — from the reader's saved choice,
   * or their browser's preference on a first visit. It arrives already decided
   * so the server and the hydrating client agree on it; see
   * `lib/language-preference`.
   */
  initialLanguage: Language;
}) {
  const [lang, setLangState] = useState<Language>(initialLanguage);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const isArabic = lang === "ar";
  // Fetched on the server by the root route's loader, so it is here from the
  // first render and the labels never switch from built-in text to the CMS's.
  const { data: overrides } = useQuery(siteSettingsQuery);

  // Every switch is remembered, so a reload keeps the reader where they were.
  const setLang = useCallback((next: Language) => {
    setLangState(next);
    persistLanguage(next);
  }, []);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    if (isArabic) {
      document.documentElement.classList.add("lang-ar");
    } else {
      document.documentElement.classList.remove("lang-ar");
    }
  }, [lang, dir, isArabic]);

  // Memoised together: every component below this provider consumes the
  // context, so a fresh `t` or a fresh value object on each render would
  // re-render the entire tree. Both only actually change when the language
  // switches or the Payload overrides change.
  const t = useCallback(
    (key: TranslationKey) => {
      const base = SITE_SETTINGS_KEY_MAP[key];
      if (base && overrides) {
        const value = overrides[isArabic ? `${base}Ar` : base];
        if (typeof value === "string" && value) return value;
      }
      return translations[lang][key];
    },
    [lang, isArabic, overrides],
  );

  const tOptional = useCallback(
    (key: TranslationKey) => {
      const base = SITE_SETTINGS_KEY_MAP[key];
      if (base && overrides) {
        const value = overrides[isArabic ? `${base}Ar` : base];
        return typeof value === "string" ? value.trim() : "";
      }
      return t(key);
    },
    [isArabic, overrides, t],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t, tOptional, dir, isArabic }),
    [lang, setLang, t, tOptional, dir, isArabic],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
