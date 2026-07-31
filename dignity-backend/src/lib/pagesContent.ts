/**
 * Canonical content for the editable About page.
 *
 * This is the SINGLE SOURCE OF TRUTH for seeding/repairing the Payload `pages`
 * doc (slug `about`). The wording here is kept 100% equivalent
 * to the frontend fallback copy in:
 *   - src/components/About.tsx           (paragraphs + avenue items)
 *   - src/contexts/LanguageContext.tsx (titles + short descriptions)
 * so the live site looks identical whether it renders Payload content or the
 * hardcoded fallback (while Payload loads / on fetch failure / before seeding).
 *
 * The frontend reads the rich-text `body`/`bodyAr` via `extractBlocks`
 * (see frontend src/lib/payload.ts): top-level `paragraph` nodes become
 * paragraphs, and a top-level bullet `list` becomes the avenue-card items.
 * `buildBody` below produces exactly that shape.
 */

// ── Lexical rich-text builders ───────────────────────────────────────────────
// Minimal but valid Lexical (Payload 3.x default editor) node shapes. Only the
// structure the frontend parser and Payload validation need is included.

type Dir = 'ltr' | 'rtl'

/** A permissive Lexical node shape (matches what Payload's richText field accepts). */
type LexNode = { type: string; version: number; [k: string]: unknown }

function textNode(text: string): LexNode {
  return {
    type: 'text',
    version: 1,
    text,
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
  }
}

function paragraphNode(text: string, direction: Dir): LexNode {
  return {
    type: 'paragraph',
    version: 1,
    children: [textNode(text)],
    direction,
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
  }
}

function listNode(items: string[], direction: Dir): LexNode {
  return {
    type: 'list',
    version: 1,
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    children: items.map((item, i) => ({
      type: 'listitem',
      version: 1,
      value: i + 1,
      children: [textNode(item)],
      direction,
      format: '',
      indent: 0,
    })),
    direction,
    format: '',
    indent: 0,
  }
}

/**
 * Build a Lexical rich-text value from ordered paragraphs and an optional
 * trailing bullet list. Returns the `{ root }` object Payload stores for a
 * richText field.
 */
export function buildBody(paragraphs: string[], items: string[], direction: Dir) {
  const children: LexNode[] = paragraphs.map((p) => paragraphNode(p, direction))
  if (items.length > 0) children.push(listNode(items, direction))
  return {
    root: {
      type: 'root',
      version: 1,
      children,
      direction,
      format: '' as const,
      indent: 0,
    },
  }
}

// ── Canonical page content (mirrors frontend fallback) ───────────────────────

const ABOUT_PARAGRAPHS_EN = [
  'The Dignity Initiative (Karama) is a research initiative at Birzeit University. Its mission is to advance knowledge production that safeguards and fosters human dignity. The initiative is grounded in the understanding that dignity — an interdisciplinary concept — serves as a meaningful point of intersection between diverse academic fields, and a foundational pillar for scientific research ethics.',
  'Dignity is inseparable from free will, the capacity to exercise it, equality, and justice. Karama views these principles as central to the process of knowledge production, especially in situations that were deformed by various types and forms of hegemony, in particular colonial hegemony. The need to study dignity and related principles is a priority in Palestine, which continues to experience colonial domination.',
  'Karama functions as a platform for interdisciplinary research, working to expand this approach and foster this tradition within an academic environment that was traditionally designed in accordance with assumed disciplinary boundaries. Its methodological orientation reflects a clear commitment to transforming reality and advancing emancipation — an approach grounded in praxis.',
  'Karama realizes its goals through several avenues:',
]

const ABOUT_PARAGRAPHS_AR = [
  'مبادرة كرامة مبادرة بحثية في جامعة بيرزيت، تهدف إلى تعزيز إنتاج المعرفة الذي يصون ويعزز الكرامة الإنسانية. وترتكز المبادرة إلى فهمٍ يرى في مفهوم الكرامة، بوصفه مفهوماً متداخل الحقول، نقطة التقاء جوهرية بين الحقول الأكاديمية المتنوّعة، ومرتكزاً لمبادئ أخلاق البحث العلمي.',
  'لا تنفصل الكرامة عن الإرادة الحرة، والقدرة على ممارستها. كما لا تنفصل عن المساواة، والعدالة. وتعتبر مبادرة الكرامة هذه المبادئ عناصر مركزية في عملية إنتاج المعرفة، وخصوصاً في الأماكن التي شوّهتها أنواع وأشكال الهيمنة، لا سيما الاستعمارية. ولذلك، فإن الحاجة إلى دراسة الكرامة والمبادئ المرتبطة بها في فلسطين، التي لا تزال تعيش واقعاً استعمارياً مستمراً، ملحّة.',
  'تعمل مبادرة كرامة بوصفها منصّة للبحث متداخل الحقول، وتسعى إلى توسيع هذا التوجّه وتعزيز حضوره داخل بيئة أكاديمية تقوم تقليدياً على افتراض الانفصال بين الحقول المعرفية. ويعبّر التوجّه المنهجي للمبادرة عن التزام بتغيير الواقع وتعزيز مسارات التحرر، وهو التزام يستند إلى الممارسة المنظّرة (praxis) – التأثير على الواقع باستخدام الفعل الواعي.',
  'تسعى مبادرة كرامة إلى تحقيق هدفها عبر عدة مسارات:',
]

const ABOUT_ITEMS_EN = [
  'Conducting research studies on the concept of dignity and related themes.',
  "Developing and promoting a research ethics approach that ensures research's contribution to safeguarding human dignity.",
  "Building meaningful partnerships with scholars interested in Karama's goals worldwide, and encouraging academic dialogue and exchange.",
  'Engaging students as active partners, not passive recipients, in university life, and expanding student exchange.',
  'Creating additional spaces for free critical thinking and intellectual engagement beyond formal courses and classrooms.',
  'Organising seminars, conferences, research forums, dialogues, and other academic activities.',
  'Disseminating relevant intellectual output in various forms.',
  'Supporting student- and community-driven initiatives that align with its mission.',
]

const ABOUT_ITEMS_AR = [
  'إجراء دراسات علمية حول مفهوم الكرامة والموضوعات ذات الصلة.',
  'تطوير وتعزيز منظومة أخلاق البحث العلمي تضمن مساهمة الأبحاث في صون الكرامة الإنسانية.',
  'بناء شراكات فاعلة مع باحثين مهتمين بأهداف المبادرة حول العالم، وتشجيع الحوار والتبادل الأكاديمي.',
  'إشراك الطلبة بوصفهم شركاء فاعلين في الحياة الجامعية، لا مجرد متلقين، وتوسيع التبادل الطلابي.',
  'خلق مساحات إضافية للتفكير النقدي الحر، وللنشاط الفكري خارج القاعات والمساقات الرسمية.',
  'تنظيم الندوات، والمؤتمرات، والملتقيات البحثية، والحوارات، وغيرها من الفعاليات الأكاديمية.',
  'نشر وتعميم الإنتاج الفكري ذات العلاقة بمختلف الأشكال.',
  'دعم المبادرات الطلابية والمجتمعية التي تنسجم مع رسالة المبادرة.',
]

export type PageSeed = {
  slug: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  /** Optional — only the long-form pages ship prose here. */
  body?: ReturnType<typeof buildBody>
  bodyAr?: ReturnType<typeof buildBody>
}

/**
 * Section pages — one per subtopic in the site header nav.
 *
 * These routes render their list content from a dedicated collection (news,
 * seminars, publications-items, …), but their heading + intro paragraph come
 * from a Pages doc so a content manager can edit them. Without a doc the
 * frontend silently falls back to hardcoded copy and the text is uneditable,
 * so every nav subtopic gets an entry here.
 *
 * Slugs must match the `usePage("…")` / `pageSlug="…"` calls in the frontend.
 * Titles + descriptions are copied verbatim from the frontend fallback strings
 * in src/contexts/LanguageContext.tsx, keeping Payload and the fallback 1:1.
 */
const SECTION_PAGES: PageSeed[] = [
  {
    slug: "participants",
    title: "Participants",
    titleAr: "المشاركون",
    description: "These are the people who got us to where we are today.\nResearchers, academics, and affiliates united by a commitment to human dignity.",
    descriptionAr: "هؤلاء هم الأشخاص الذين أوصلونا إلى ما نحن عليه اليوم.\nباحثون وأكاديميون ومنتسبون يجمعهم الالتزام بخدمة الكرامة الإنسانية.",
  },
  {
    slug: "partners",
    title: "Partners",
    titleAr: "الشركاء",
    description: "Institutions and organizations that collaborate with the Dignity initiative.",
    descriptionAr: "المؤسسات والمنظمات التي تتعاون مع مبادرة الكرامة.",
  },
  {
    slug: "news",
    title: "News",
    titleAr: "أخبار",
    description: "Latest news from the Dignity initiative.",
    descriptionAr: "آخر الأخبار من مبادرة الكرامة.",
  },
  {
    slug: "announcements",
    title: "Announcements",
    titleAr: "إعلانات",
    description: "Latest announcements from the Dignity initiative.",
    descriptionAr: "آخر الإعلانات من مبادرة الكرامة.",
  },
  {
    slug: "photos",
    title: "Photos",
    titleAr: "صور",
    description: "Latest photos from the Dignity initiative.",
    descriptionAr: "آخر الصور من مبادرة الكرامة.",
  },
  {
    slug: "clippings",
    title: "Clippings",
    titleAr: "قصاصات",
    description: "Latest clippings from the Dignity initiative.",
    descriptionAr: "آخر المقالات الصحفية من مبادرة الكرامة.",
  },
  {
    slug: "seminars",
    title: "Seminars",
    titleAr: "ندوات",
    description: "Information about Seminars organized through the Dignity initiative.",
    descriptionAr: "معلومات حول الندوات المنظمة من خلال مبادرة الكرامة.",
  },
  {
    slug: "conferences",
    title: "Conferences",
    titleAr: "مؤتمرات",
    description: "Information about Conferences organized through the Dignity initiative.",
    descriptionAr: "معلومات حول المؤتمرات المنظمة من خلال مبادرة الكرامة.",
  },
  {
    slug: "meetings",
    title: "Meetings",
    titleAr: "لقاءات",
    description: "Information about Meetings organized through the Dignity initiative.",
    descriptionAr: "معلومات حول اللقاءات المنظمة من خلال مبادرة الكرامة.",
  },
  {
    slug: "windsor",
    title: "The Windsor Birzeit Dignity Initiative",
    titleAr: "مبادرة وندسور بيرزيت للكرامة",
    description: "Information about The Windsor Birzeit Dignity Initiative organized through the Dignity initiative.",
    descriptionAr: "معلومات حول مبادرة وندسور بيرزيت للكرامة المنظمة من خلال مبادرة الكرامة.",
  },
  {
    slug: "research",
    title: "Research",
    titleAr: "الأبحاث",
    description: "The ongoing research areas the Dignity initiative is working on.",
    descriptionAr: "مجالات البحث الجارية التي تعمل عليها مبادرة الكرامة.",
  },
  {
    slug: "publications-books",
    title: "Books",
    titleAr: "كتب",
    description: "Books, papers, reports, and other publications produced by the Dignity initiative.",
    descriptionAr: "كتب وأوراق بحثية وتقارير وغيرها من المنشورات الصادرة عن مبادرة الكرامة.",
  },
  {
    slug: "publications-papers",
    title: "Papers",
    titleAr: "أوراق بحثية",
    description: "Books, papers, reports, and other publications produced by the Dignity initiative.",
    descriptionAr: "كتب وأوراق بحثية وتقارير وغيرها من المنشورات الصادرة عن مبادرة الكرامة.",
  },
  {
    slug: "publications-reports",
    title: "Reports",
    titleAr: "تقارير",
    description: "Books, papers, reports, and other publications produced by the Dignity initiative.",
    descriptionAr: "كتب وأوراق بحثية وتقارير وغيرها من المنشورات الصادرة عن مبادرة الكرامة.",
  },
  {
    slug: "publications-brochures",
    title: "Brochures",
    titleAr: "كتيبات",
    description: "Books, papers, reports, and other publications produced by the Dignity initiative.",
    descriptionAr: "كتب وأوراق بحثية وتقارير وغيرها من المنشورات الصادرة عن مبادرة الكرامة.",
  },
  {
    slug: "publications-theses",
    title: "Theses",
    titleAr: "رسائل جامعية",
    description: "Books, papers, reports, and other publications produced by the Dignity initiative.",
    descriptionAr: "كتب وأوراق بحثية وتقارير وغيرها من المنشورات الصادرة عن مبادرة الكرامة.",
  },
  {
    slug: "publications-audiovisual",
    title: "Audiovisual",
    titleAr: "مواد سمعية بصرية",
    description: "Books, papers, reports, and other publications produced by the Dignity initiative.",
    descriptionAr: "كتب وأوراق بحثية وتقارير وغيرها من المنشورات الصادرة عن مبادرة الكرامة.",
  },
  {
    slug: "publications-posters",
    title: "Posters",
    titleAr: "ملصقات",
    description: "Books, papers, reports, and other publications produced by the Dignity initiative.",
    descriptionAr: "كتب وأوراق بحثية وتقارير وغيرها من المنشورات الصادرة عن مبادرة الكرامة.",
  },
  {
    slug: "information-readings",
    title: "Readings and Documents",
    titleAr: "قراءات ووثائق",
    description: "Readings, documents, and databases relevant to the Dignity initiative's research.",
    descriptionAr: "قراءات ووثائق وقواعد معلومات ذات صلة بأبحاث مبادرة الكرامة.",
  },
  {
    slug: "information-databases",
    title: "Databases",
    titleAr: "قواعد معلومات",
    description: "Readings, documents, and databases relevant to the Dignity initiative's research.",
    descriptionAr: "قراءات ووثائق وقواعد معلومات ذات صلة بأبحاث مبادرة الكرامة.",
  },
]

/**
 * Every editable page on the site: the two long-form pages (with prose bodies)
 * plus one doc per header-nav subtopic.
 */
export const PAGE_SEEDS: PageSeed[] = [
  {
    slug: 'about',
    title: 'The Dignity Research Initiative',
    titleAr: 'مبادرة كرامة البحثية',
    description: 'An overview of the Dignity initiative, its origins, and its scholarly purpose.',
    descriptionAr: 'نظرة عامة على مبادرة الكرامة وأصولها وغرضها الأكاديمي.',
    body: buildBody(ABOUT_PARAGRAPHS_EN, ABOUT_ITEMS_EN, 'ltr'),
    bodyAr: buildBody(ABOUT_PARAGRAPHS_AR, ABOUT_ITEMS_AR, 'rtl'),
  },
  ...SECTION_PAGES,
]
