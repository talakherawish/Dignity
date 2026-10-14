import type { GlobalConfig } from 'payload'

/**
 * The words at the top of a website page that lists subjects -- Information →
 * Databases and Information → Readings and Documents -- above the subjects.
 *
 * Hidden from the sidebar: each is edited from the top of its own subject list
 * (src/components/admin/PageTextPanel.tsx), so an editor sees the page's
 * heading and introduction right where they manage the subjects under it.
 * Left empty, the website falls back to its built-in page name.
 */
function pageText(slug: string, label: string): GlobalConfig {
  return {
    slug,
    label,
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
}

export const DatabasesPage = pageText('databases-page', 'Databases page')
export const ReadingsPage = pageText('readings-page', 'Readings and Documents page')
