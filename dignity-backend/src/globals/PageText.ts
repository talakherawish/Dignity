import type { GlobalConfig } from 'payload'

/**
 * The words at the top of a website page that lists things -- Information →
 * Databases, Information → Readings and Documents, About the Dignity
 * Initiative → Working Group -- above the list itself.
 *
 * Hidden from the sidebar: each is edited from the top of its own list
 * (src/components/admin/PageTextPanel.tsx), so an editor sees the page's
 * heading and introduction right where they manage what is listed under it,
 * rather than hunting for a separate entry that edits the same page. Left
 * empty, the website falls back to its built-in page name and introduction.
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
export const WorkingGroupPage = pageText('working-group-page', 'Working Group page')
