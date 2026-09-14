import type { CollectionConfig, Field } from 'payload'
import { singletonCreateAccess, singletonListView } from '../lib/singleton'

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
 * Each holds a single document -- singletonListView sends the admin straight
 * to it (or to the create form, the first time) instead of the normal list
 * view, and singletonCreateAccess blocks a second one from being created.
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
      name: 'body',
      type: 'richText',
      label: 'Page Content (English)',
    },
    {
      name: 'bodyAr',
      type: 'richText',
      label: 'Page Content (Arabic)',
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
      components: { views: { list: singletonListView } },
    },
    versions: {
      drafts: true,
    },
    access: {
      read: ({ req }) => {
        if (req.user) return true
        return { _status: { equals: 'published' } }
      },
      create: singletonCreateAccess(slug),
      update: ({ req }) => !!req.user,
      delete: ({ req }) => !!req.user,
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
