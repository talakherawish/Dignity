import type { GlobalConfig, Field } from 'payload'

function pair(name: string, label: string, textarea?: boolean): Field[] {
  const type = textarea ? 'textarea' : 'text'
  return [
    { name, type, label: label + ' (English)' } as Field,
    { name: name + 'Ar', type, label: label + ' (Arabic)', admin: { rtl: true } } as Field,
    ]
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Site',
    description: 'Site-wide text: navigation menu, homepage hero, footer, and small UI labels. Editing a field here updates it everywhere it appears on the site.',
  },
  access: {
    read: () => true,
    update: ({ req }) => req.user?.role === 'content-manager',
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
            ...pair('navAboutFellows', 'About: Participants'),
            ...pair('navMediaNews', 'About: News'),
            ...pair('navMediaAnnouncements', 'About: Announcements'),
            ...pair('navMediaPhotos', 'About: Photos'),
            ...pair('navMediaClippings', 'About: Clippings'),
            ...pair('navAboutPartners', 'About: Partners'),

            ...pair('navActivities', 'Activities — menu heading'),
            // Field name kept from when this link sat under a 'Projects' menu, so
            // the wording already saved in the database survives. It is the
            // Research link inside Activities.
            ...pair('navProjectsResearch', 'Activities: Research'),
            ...pair('navActivitiesSeminars', 'Activities: Seminars'),
            ...pair('navActivitiesConferences', 'Activities: Conferences'),
            ...pair('navActivitiesMeetings', 'Activities: Meetings'),
            ...pair('navActivitiesWindsor', 'Activities: The Windsor Birzeit Dignity Initiative'),

            ...pair('navPublications', 'Publications — menu heading'),
            ...pair('navPublicationsBooks', 'Publications: Books'),
            ...pair('navPublicationsPapers', 'Publications: Papers'),
            ...pair('navPublicationsReports', 'Publications: Reports'),
            ...pair('navPublicationsBrochures', 'Publications: Brochures'),
            ...pair('navPublicationsTheses', 'Publications: Theses'),
            ...pair('navPublicationsAudiovisual', 'Publications: Audiovisual'),
            ...pair('navPublicationsPosters', 'Publications: Posters'),

            ...pair('navInformation', 'Information — menu heading'),
            ...pair('navInformationReadings', 'Information: Readings and Documents'),
            ...pair('navInformationDatabases', 'Information: Databases'),
            ],
        },
        {
          label: 'Homepage',
          fields: [
            ...pair('heroEyebrow', 'Hero Eyebrow Label'),
            ...pair('heroTitle', 'Hero Title', true),
            ...pair('heroDesc', 'Hero Description', true),
            ...pair('heroBtnAbout', 'Hero Button: About'),
            ...pair('heroBtnResearch', 'Hero Button: Research'),
            ...pair('pillarResearch', 'Pillar: Research Title'),
            ...pair('pillarResearchDesc', 'Pillar: Research Description', true),
            ...pair('pillarDialogue', 'Pillar: Dialogue Title'),
            ...pair('pillarDialogueDesc', 'Pillar: Dialogue Description', true),
            ...pair('pillarPartnership', 'Pillar: Partnership Title'),
            ...pair('pillarPartnershipDesc', 'Pillar: Partnership Description', true),
            ...pair('teamEyebrow', 'Team Section Eyebrow'),
            ...pair('teamTitle', 'Team Section Title'),
            ...pair('teamBtn', 'Team Section Button'),
            ...pair('newsViewAll', 'View All Link Text'),
            ],
        },
        {
          label: 'Footer',
          fields: [
            ...pair('footerAbout', 'About Blurb', true),
            ...pair('footerExplore', 'Explore Heading'),
            ...pair('footerParticipants', 'Participants Link'),
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
            ...pair('footerSitemap', 'Sitemap Link'),
            ...pair('footerCopyright', 'Copyright Line'),
            ...pair('footerResources', 'Resources Heading'),
            ...pair('footerStudying', 'Studying Materials Link'),
            ...pair('footerLibrary', 'Library Link'),
            ...pair('footerDatabases', 'Databases Link'),
            ],
        },
        {
          label: 'Small UI Labels',
          fields: [
            ...pair('newsPrev', 'Carousel: Previous'),
            ...pair('newsNext', 'Carousel: Next'),
            ...pair('newsReadMore', 'Read More Label'),
            ...pair('newsCollapse', 'Collapse Label'),
            ...pair('contentUntranslated', 'Notice: Body Not Translated Yet'),
            ...pair('projectsArea', 'Research Area Label'),
            ...pair('navMedia', 'Media Pages: Section Eyebrow'),
            ],
        },
        ],
    },
    ],
}
