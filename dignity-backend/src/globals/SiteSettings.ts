import type { GlobalConfig, Field } from 'payload'
import { section } from '../lib/adminLayout'

const MAX_FEATURED_PARTICIPANTS = 3

// How many of each the homepage has room for -- the same numbers the website
// uses (HEADLINE_COUNT, CAROUSEL_COUNT and POSTER_COUNT in its routes/index.tsx).
export const MAX_HOME_NEWS_HEADLINES = 4
export const MAX_HOME_NEWS_CAROUSEL = 6
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

/** The English and Arabic wording of one label -- shown side by side (see adminLayout). */
function pair(name: string, label: string, textarea?: boolean): Field[] {
  const type = textarea ? 'textarea' : 'text'
  return [
    { name, type, label: label + ' (English)' } as Field,
    { name: name + 'Ar', type, label: label + ' (Arabic)', admin: { rtl: true } } as Field,
  ]
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
          // One section per menu, left to right as in the header.
          fields: [
            section('About Menu', [
              ...pair('navAbout', 'Menu Heading'),
              ...pair('navAboutInitiative', 'About the Initiative'),
              ...pair('navAboutFellows', 'Working Group'),
              ...pair('navMediaNews', 'News & Announcements'),
              ...pair('navMediaPhotos', 'Photos'),
              ...pair('navMediaClippings', 'Clippings'),
              ...pair('navAboutPartners', 'Partners'),
            ]),
            section('Activities Menu', [
              ...pair('navActivities', 'Menu Heading'),
              // Field name kept from when this link sat under a 'Projects' menu, so
              // the wording already saved in the database survives. It is the
              // Research link inside Activities.
              ...pair('navProjectsResearch', 'Research'),
              // Seminars, Roundtables, Workshops, Conferences and Meetings were
              // each their own top-level entry (Meetings still had a page of its
              // own); they are now sub-types on one Forums page.
              ...pair('navActivitiesForums', 'Forums'),
              ...pair('navActivitiesWindsor', 'The Windsor Birzeit Dignity Initiative'),
              ...pair('navActivitiesIdeaFactory', 'Idea Factory'),
              ...pair('navActivitiesTaskForceAI', 'Task Force on AI'),
            ]),
            section('Publications Menu', [
              ...pair('navPublications', 'Menu Heading'),
              ...pair('navPublicationsBooks', 'Books'),
              ...pair('navPublicationsPapers', 'Papers'),
              ...pair('navPublicationsReports', 'Reports'),
              ...pair('navPublicationsBrochures', 'Brochures'),
              ...pair('navPublicationsTheses', 'Theses'),
              ...pair('navPublicationsAudiovisual', 'Audiovisual'),
              ...pair('navPublicationsPosters', 'Posters'),
              // Still called navAboutStickers in Payload, from when this link sat
              // under the About menu -- renaming the field would strand the
              // wording already saved in the database.
              ...pair('navAboutStickers', 'Stickers & Bookmarks'),
            ]),
            section('Information Menu', [
              ...pair('navInformation', 'Menu Heading'),
              ...pair('navInformationReadings', 'Readings and Documents'),
              ...pair('navInformationDatabases', 'Databases'),
            ]),
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
            // In the order the footer shows them.
            section('Contact', [
              ...pair('footerContact', 'Heading'),
              ...pair('footerUniversity', 'University Name'),
              ...pair('footerPobox', 'P.O. Box Line'),
              ...pair('footerZip', 'Zip Code Line'),
              ...pair('footerPhone', 'Phone Line'),
              ...pair('footerFax', 'Fax Line'),
              ...pair('footerEmail', 'Email Line'),
            ]),
            section('Stay in Touch', [
              ...pair('footerSubscribe', 'Heading'),
              ...pair('footerSubscribeBtn', 'Subscribe Button'),
              ...pair('footerSubscribePlaceholder', 'Email Box Placeholder (sign-up form)'),
            ]),
            section('Bottom Bar', [
              ...pair('footerCopyright', 'Copyright Line'),
              ...pair('footerResources', 'Resources Heading'),
              ...pair('footerStudying', 'Studying Materials Link'),
              ...pair('footerDatabases', 'Databases Link'),
              ...pair('footerDisclaimer', 'Disclaimer Link'),
              ...pair('footerPrivacy', 'Privacy Policy Link'),
            ]),
          ],
        },
        {
          label: 'Small UI Labels',
          fields: [
            section('News & Announcements', [
              ...pair('newsReadMore', 'Read More'),
              ...pair('newsCollapse', 'Collapse'),
            ]),
            section('Forums Filter', [
              ...pair('forumFilterAll', 'All'),
              ...pair('forumTypeSeminar', 'Seminar'),
              ...pair('forumTypeRoundtable', 'Roundtable'),
              ...pair('forumTypeWorkshop', 'Workshop'),
              ...pair('forumTypeConference', 'Conference'),
              ...pair('forumTypeEncounters', 'Encounters'),
            ]),
            section('Any Page', [
              ...pair('contentUntranslated', 'Notice: Not Translated Yet'),
            ]),
          ],
        },
      ],
    },
  ],
}
