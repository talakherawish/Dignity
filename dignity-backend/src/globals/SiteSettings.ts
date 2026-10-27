import type { GlobalConfig, Field } from 'payload'

const MAX_FEATURED_PARTICIPANTS = 3

// How many of each the homepage has room for -- the same numbers the website
// uses (HEADLINE_COUNT, CAROUSEL_COUNT and POSTER_COUNT in its routes/index.tsx).
const MAX_HOME_NEWS_HEADLINES = 4
const MAX_HOME_NEWS_CAROUSEL = 6
const MAX_HOME_PUBLICATIONS = 10

const PUBLICATION_COLLECTIONS = [
  'books',
  'papers',
  'reports',
  'brochures',
  'theses',
  'audiovisual',
  'posters',
] as const

/** The English and Arabic wording of one label, side by side. */
function pair(name: string, label: string, textarea?: boolean): Field[] {
  const type = textarea ? 'textarea' : 'text'
  return [
    {
      type: 'row',
      fields: [
        { name, type, label: label + ' (English)', admin: { width: '50%' } } as Field,
        {
          name: name + 'Ar',
          type,
          label: label + ' (Arabic)',
          admin: { width: '50%', rtl: true },
        } as Field,
      ],
    },
  ]
}

/** One section of the homepage, under its own heading, in page order. */
function section(label: string, fields: Field[]): Field {
  return { type: 'collapsible', label, admin: { initCollapsed: false }, fields }
}

function atMost(max: number, what: string) {
  return (value: unknown) =>
    Array.isArray(value) && value.length > max ? `Choose at most ${max} ${what}.` : true
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Site',
    description:
      'Site-wide text: navigation menu, homepage hero, footer, and small UI labels. Editing a field here updates it everywhere it appears on the site.',
  },
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Navigation Menu',
          description:
            'Every label in the site header, listed in the order the menus appear. Leave a field blank to fall back to the wording built into the site.',
          fields: [
            ...pair('navAbout', 'About — menu heading'),
            ...pair('navAboutInitiative', 'About: About the Initiative'),
            ...pair('navAboutFellows', 'About: Working Group'),
            ...pair('navMediaNews', 'About: News & Announcements'),
            ...pair('navMediaPhotos', 'About: Photos'),
            ...pair('navMediaClippings', 'About: Clippings'),
            ...pair('navAboutPartners', 'About: Partners'),

            ...pair('navActivities', 'Activities — menu heading'),
            // Field name kept from when this link sat under a 'Projects' menu, so
            // the wording already saved in the database survives. It is the
            // Research link inside Activities.
            ...pair('navProjectsResearch', 'Activities: Research'),
            // Seminars, Roundtables, Workshops, Conferences and Meetings were
            // each their own top-level entry (Meetings still had a page of its
            // own); they are now sub-types on one Forums page.
            ...pair('navActivitiesForums', 'Activities: Forums'),
            ...pair('navActivitiesWindsor', 'Activities: The Windsor Birzeit Dignity Initiative'),
            // Content shape not decided yet -- these two are placeholder pages
            // until there's something to put on them.
            ...pair('navActivitiesIdeaFactory', 'Activities: Idea Factory'),
            ...pair('navActivitiesTaskForceAI', 'Activities: Task Force on AI'),

            ...pair('navPublications', 'Publications — menu heading'),
            ...pair('navPublicationsBooks', 'Publications: Books'),
            ...pair('navPublicationsPapers', 'Publications: Papers'),
            ...pair('navPublicationsReports', 'Publications: Reports'),
            ...pair('navPublicationsBrochures', 'Publications: Brochures'),
            ...pair('navPublicationsTheses', 'Publications: Theses'),
            ...pair('navPublicationsAudiovisual', 'Publications: Audiovisual'),
            ...pair('navPublicationsPosters', 'Publications: Posters'),
            // Still called navAboutStickers in Payload, from when this link sat
            // under the About menu -- renaming the field would strand the
            // wording already saved in the database.
            ...pair('navAboutStickers', 'Publications: Stickers & Bookmarks'),

            ...pair('navInformation', 'Information — menu heading'),
            ...pair('navInformationReadings', 'Information: Readings and Documents'),
            ...pair('navInformationDatabases', 'Information: Databases'),
          ],
        },
        {
          label: 'Homepage',
          // Top to bottom, the way the homepage reads. An eyebrow left blank
          // is left off the page.
          fields: [
            section('Opening Video', [
              ...pair('heroEyebrow', 'Eyebrow'),
              ...pair('heroTitle', 'Title', true),
              ...pair('heroDesc', 'Description', true),
            ]),
            section('Latest News and Announcements', [
              ...pair('newsTitle', 'Heading'),
              ...pair('newsViewAll', 'View All Link'),
              // Side by side as on the English page: the photo carousel on
              // the left, the numbered list of titles on the right. Nothing
              // picked fills each side with the newest entries instead.
              {
                type: 'row',
                fields: [
                  {
                    name: 'homeNewsCarousel',
                    type: 'relationship',
                    relationTo: 'news',
                    hasMany: true,
                    label: `With Image (up to ${MAX_HOME_NEWS_CAROUSEL})`,
                    filterOptions: {
                      _status: { equals: 'published' },
                      image: { exists: true },
                    },
                    validate: atMost(MAX_HOME_NEWS_CAROUSEL, 'entries with an image'),
                    admin: { width: '50%' },
                  },
                  {
                    name: 'homeNewsHeadlines',
                    type: 'relationship',
                    relationTo: 'news',
                    hasMany: true,
                    label: `Title Only (up to ${MAX_HOME_NEWS_HEADLINES})`,
                    filterOptions: { _status: { equals: 'published' } },
                    validate: atMost(MAX_HOME_NEWS_HEADLINES, 'title-only entries'),
                    admin: { width: '50%' },
                  },
                ],
              },
            ]),
            section('A Look at Our Publications', [
              ...pair('postersTitle', 'Heading'),
              ...pair('postersViewAll', 'View All Link'),
              {
                name: 'homePublications',
                type: 'relationship',
                relationTo: [...PUBLICATION_COLLECTIONS],
                hasMany: true,
                label: `Publications, in order (up to ${MAX_HOME_PUBLICATIONS})`,
                filterOptions: { _status: { equals: 'published' } },
                validate: atMost(MAX_HOME_PUBLICATIONS, 'publications'),
              },
            ]),
            section('Meet the Participants', [
              ...pair('teamEyebrow', 'Eyebrow'),
              ...pair('teamTitle', 'Heading'),
              {
                name: 'featuredParticipants',
                type: 'relationship',
                relationTo: 'participants',
                hasMany: true,
                label: `Participants, in order (up to ${MAX_FEATURED_PARTICIPANTS})`,
                filterOptions: {
                  _status: { equals: 'published' },
                },
                validate: atMost(MAX_FEATURED_PARTICIPANTS, 'people'),
              },
              ...pair('teamBtn', 'Button'),
            ]),
          ],
        },
        {
          label: 'Footer',
          fields: [
            ...pair('footerContact', 'Contact Heading'),
            ...pair('footerUniversity', 'University Name'),
            ...pair('footerPobox', 'P.O. Box Line'),
            ...pair('footerZip', 'Zip Code Line'),
            ...pair('footerPhone', 'Phone Line'),
            ...pair('footerFax', 'Fax Line'),
            ...pair('footerEmail', 'Email Line'),
            ...pair('footerSubscribe', 'Subscribe Heading'),
            ...pair('footerSubscribePlaceholder', 'Subscribe Input Placeholder'),
            ...pair('footerSubscribeBtn', 'Subscribe Button'),
            ...pair('footerDisclaimer', 'Disclaimer Link'),
            ...pair('footerPrivacy', 'Privacy Policy Link'),
            ...pair('footerCopyright', 'Copyright Line'),
            ...pair('footerResources', 'Resources Heading'),
            ...pair('footerStudying', 'Studying Materials Link'),
            ...pair('footerDatabases', 'Databases Link'),
          ],
        },
        {
          label: 'Small UI Labels',
          fields: [
            ...pair('newsReadMore', 'Read More Label'),
            ...pair('newsCollapse', 'Collapse Label'),
            ...pair('contentUntranslated', 'Notice: Body Not Translated Yet'),
            ...pair('forumFilterAll', 'Forums Filter: All'),
            ...pair('forumTypeSeminar', 'Forum Type: Seminar'),
            ...pair('forumTypeRoundtable', 'Forum Type: Roundtable'),
            ...pair('forumTypeWorkshop', 'Forum Type: Workshop'),
            ...pair('forumTypeConference', 'Forum Type: Conference'),
            ...pair('forumTypeEncounters', 'Forum Type: Encounters'),
          ],
        },
      ],
    },
  ],
}
