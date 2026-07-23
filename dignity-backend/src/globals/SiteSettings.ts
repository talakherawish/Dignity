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
          fields: [
            ...pair('navHome', 'Home'),
            ...pair('navAbout', 'About (menu heading)'),
            ...pair('navAboutInitiative', 'About the Initiative'),
            ...pair('navAboutMission', 'Mission and Vision'),
            ...pair('navAboutFellows', 'Participants'),
            ...pair('navAboutPartners', 'Partners'),
            ...pair('navProjects', 'Projects (menu heading)'),
            ...pair('navProjectsResearch', 'Research Projects'),
            ...pair('navActivities', 'Activities (menu heading)'),
            ...pair('navActivitiesSeminars', 'Seminars'),
            ...pair('navActivitiesConferences', 'Conferences'),
            ...pair('navActivitiesMeetings', 'Meetings'),
            ...pair('navActivitiesWindsor', 'The Windsor Birzeit Dignity Initiative'),
            ...pair('navMedia', 'Media and Updates (menu heading)'),
            ...pair('navMediaNews', 'News'),
            ...pair('navMediaAnnouncements', 'Announcements'),
            ...pair('navMediaPhotos', 'Photos'),
            ...pair('navMediaClippings', 'Clippings'),
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
            ...pair('projectsArea', 'Research Area Label'),
            ],
        },
        ],
    },
    ],
}
