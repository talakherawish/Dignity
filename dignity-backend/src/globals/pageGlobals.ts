import type { Field, GlobalConfig } from 'payload'

/**
 * The editable heading + intro text for every page on the site, exposed as one
 * global per page.
 *
 * These used to live as 22 documents inside a single `pages` collection, which
 * meant every page's copy — About the Initiative, Partners,
 * the Windsor initiative — was buried in one undifferentiated list sitting
 * under "About the Dignity Initiative", regardless of which part of the site it
 * actually drove. Finding a page's text meant knowing to look in "Pages" and
 * recognising its slug.
 *
 * As globals each page instead appears by name in the sidebar group matching
 * the website's own navigation, so the admin mirrors the public site: the
 * Windsor initiative sits under Activities, Partners under About the Dignity
 * Initiative, and so on. Globals are the right fit because these are
 * single, fixed pages — there is never more than one "Partners" page — so
 * nothing here should be creatable or deletable.
 *
 * The global slug is the same string the frontend already passes to
 * `usePage()`, so no page mapping has to be kept in sync by hand.
 */

/**
 * Globals and collections share one slug namespace, and nine of these pages
 * name the very thing they describe — `news`, `participants`, `seminars` and so
 * on all already exist as collections. Every page global is therefore stored
 * under a `page-` prefix; `pageGlobalSlug` is the single place that mapping
 * lives, and the frontend keeps passing the unprefixed key.
 */
export const pageGlobalSlug = (key: string) => `page-${key}`

type PageGlobalSpec = {
  /** Matches the slug the frontend requests (unprefixed). */
  slug: string
  /** Shown in the admin sidebar. */
  label: string
  /** Sidebar group — mirrors the site's top-level navigation. */
  group: string
  /** Whether this page renders long-form prose under its heading. */
  withBody?: boolean
}

const PAGE_GLOBALS: PageGlobalSpec[] = [
  // ── About the Dignity Initiative ────────────────────────────────────────
  { slug: 'about', label: 'About the Initiative', group: 'About the Dignity Initiative', withBody: true },
  { slug: 'participants', label: 'Participants (page text)', group: 'About the Dignity Initiative' },
  { slug: 'partners', label: 'Partners', group: 'About the Dignity Initiative', withBody: true },
  { slug: 'news', label: 'News (page text)', group: 'About the Dignity Initiative' },
  { slug: 'announcements', label: 'Announcements (page text)', group: 'About the Dignity Initiative' },
  { slug: 'photos', label: 'Photos (page text)', group: 'About the Dignity Initiative' },
  { slug: 'clippings', label: 'Clippings (page text)', group: 'About the Dignity Initiative' },

  // ── Activities ──────────────────────────────────────────────────────────
  { slug: 'research', label: 'Research (page text)', group: 'Activities' },
  { slug: 'seminars', label: 'Seminars (page text)', group: 'Activities' },
  { slug: 'conferences', label: 'Conferences (page text)', group: 'Activities' },
  { slug: 'meetings', label: 'Meetings (page text)', group: 'Activities' },
  { slug: 'windsor', label: 'The Windsor Birzeit Dignity Initiative', group: 'Activities', withBody: true },

  // ── Publications ────────────────────────────────────────────────────────
  { slug: 'publications-books', label: 'Books (page text)', group: 'Publications' },
  { slug: 'publications-papers', label: 'Papers (page text)', group: 'Publications' },
  { slug: 'publications-reports', label: 'Reports (page text)', group: 'Publications' },
  { slug: 'publications-brochures', label: 'Brochures (page text)', group: 'Publications' },
  { slug: 'publications-theses', label: 'Theses (page text)', group: 'Publications' },
  { slug: 'publications-audiovisual', label: 'Audiovisual (page text)', group: 'Publications' },
  { slug: 'publications-posters', label: 'Posters (page text)', group: 'Publications' },

  // ── Resources ───────────────────────────────────────────────────────────
  { slug: 'information-readings', label: 'Readings and Documents (page text)', group: 'Resources' },
  { slug: 'information-databases', label: 'Databases (page text)', group: 'Resources' },
]

function fieldsFor(spec: PageGlobalSpec): Field[] {
  const fields: Field[] = [
    { name: 'title', type: 'text', label: 'Page Title (English)' },
    { name: 'titleAr', type: 'text', label: 'Page Title (Arabic)', admin: { rtl: true } },
    { name: 'description', type: 'textarea', label: 'Short Intro Shown Under the Title (English)' },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Short Intro Shown Under the Title (Arabic)',
      admin: { rtl: true },
    },
  ]

  // Only the long-form pages carry prose; the rest are list pages whose body
  // would never be rendered, so the field is left off rather than offering an
  // editor a box whose contents go nowhere.
  if (spec.withBody) {
    fields.push(
      { name: 'body', type: 'richText', label: 'Full Page Content (English)' },
      { name: 'bodyAr', type: 'richText', label: 'Full Page Content (Arabic)' },
    )
  }

  return fields
}

export const pageGlobals: GlobalConfig[] = PAGE_GLOBALS.map((spec) => ({
  slug: pageGlobalSlug(spec.slug),
  label: spec.label,
  admin: {
    group: spec.group,
    description: `Heading and intro text for the "${spec.label.replace(' (page text)', '')}" page on the website. Both languages are required.`,
  },
  access: {
    read: () => true,
    update: ({ req }) => req.user?.role === 'content-manager',
  },
  fields: fieldsFor(spec),
}))

/** Slugs that have a body, for the migration and for callers that need to know. */
export const PAGE_GLOBAL_SLUGS = PAGE_GLOBALS.map((p) => p.slug)
