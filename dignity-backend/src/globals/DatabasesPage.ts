import type { GlobalConfig } from 'payload'

/**
 * The words at the top of the website's Information → Databases page, above
 * the list of databases.
 *
 * Hidden from the sidebar: it is edited from the top of the Databases list
 * itself (src/components/admin/DatabasesLandingPanel.tsx), so an editor sees
 * the page's heading and introduction right where they manage the databases
 * under it. Left empty, the website falls back to its built-in "Databases".
 */
export const DatabasesPage: GlobalConfig = {
  slug: 'databases-page',
  label: 'Databases page',
  admin: { hidden: true },
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'title', type: 'text', label: 'Page title (English)' },
    { name: 'titleAr', type: 'text', label: 'Page title (Arabic)', admin: { rtl: true } },
    { name: 'intro', type: 'textarea', label: 'Introduction (English)' },
    { name: 'introAr', type: 'textarea', label: 'Introduction (Arabic)', admin: { rtl: true } },
  ],
}
