import type { CollectionConfig, Field } from 'payload'

/**
 * The two standalone pages under About the Dignity Initiative — the initiative's
 * own page and Partners. Every other entry in that menu is a list of things
 * (Participants, News, Photos…) and already had a collection; these two are
 * prose, and used to be two rows inside a general `pages` collection holding all
 * 22 page headings, which was hidden from the sidebar and read by nothing. Their
 * text was therefore uneditable in practice: the website rendered a hardcoded
 * copy of it.
 *
 * A collection each (rather than a global each) is what puts them in the
 * sidebar in the site's own order — Payload renders every global after every
 * collection within a group, so a global could not sit above Participants where
 * the website's menu puts it.
 *
 * Each holds a single document, so edit the entry that is already there rather
 * than adding another; the website reads the first one.
 */

function pageFields(): Field[] {
  return [
    {
      name: 'title',
      type: 'text',
      label: 'Page Title (English)',
    },
    {
      name: 'titleAr',
      type: 'text',
      label: 'Page Title (Arabic)',
      admin: { rtl: true },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Short Intro Shown Under the Title (English)',
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Short Intro Shown Under the Title (Arabic)',
      admin: { rtl: true },
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Full Page Content (English)',
    },
    {
      name: 'bodyAr',
      type: 'richText',
      label: 'Full Page Content (Arabic)',
    },
  ]
}

function pageCollection(
  slug: string,
  singular: string,
  plural: string,
  description: string,
): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'About the Dignity Initiative',
      useAsTitle: 'title',
      defaultColumns: ['title', 'updatedAt'],
      description,
    },
    versions: {
      drafts: true,
    },
    access: {
      read: ({ req }) => {
        if (req.user) return true
        return { _status: { equals: 'published' } }
      },
      create: ({ req }) => req.user?.role === 'content-manager',
      update: ({ req }) => req.user?.role === 'content-manager',
      delete: ({ req }) => req.user?.role === 'content-manager',
    },
    fields: pageFields(),
  }
}

export const DignityResearchInitiative = pageCollection(
  'about-initiative',
  'The Dignity Research Initiative',
  'The Dignity Research Initiative',
  'The heading, intro and full text of the website\'s "The Dignity Research Initiative" page. Open the entry below to edit it.',
)

export const Partners = pageCollection(
  'partners',
  'Partners',
  'Partners',
  'The heading, intro and full text of the website\'s Partners page. Open the entry below to edit it.',
)
