import type { CollectionConfig } from 'payload'

/**
 * The institutions the initiative works with, one document each, shown as a
 * wall of logos on About -> Partners.
 *
 * Separate from the `partners` collection in AboutPages.ts -- labelled
 * "Partners Page Text" in the admin -- which is the single prose document
 * behind that page's heading and introduction. That one is the page; this one
 * is what's on it, and it is the one someone adding a partner wants.
 *
 * Nearly every field is optional on purpose. The first two partners arrived as
 * a name and a web address and nothing else -- no dates, no description of
 * what the partnership covers -- and a form that demands a write-up before it
 * will save would have meant inventing one. A partner with only a name and a
 * logo renders as a logo, and gains a date and a sentence whenever those are
 * actually known.
 */

const YEAR_MIN = 1900
const YEAR_MAX = 2100

export const PartnerItems: CollectionConfig = {
  slug: 'partner-items',
  labels: { singular: 'Partner', plural: 'Partners' },
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'name',
    defaultColumns: ['name', 'startYear', 'endYear', 'status', 'updatedAt'],
    description:
      'The institutions shown on the website under About the Dignity Initiative → Partners. One entry per institution -- this is where you add a partner. Only the name is required; add the logo, the website and the years when you have them. The heading and introduction above them on that page are in "Partners Page Text", below.',
  },
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name (English)',
      admin: {
        description:
          'The institution\'s own name, spelled the way it spells itself -- e.g. "International Development Research Centre (IDRC)".',
      },
    },
    {
      name: 'nameAr',
      type: 'text',
      label: 'Name (Arabic / الاسم بالعربية)',
      admin: { rtl: true },
    },
    /**
     * Shown at its own proportions against a plain white panel, never cropped:
     * a logo is a fixed piece of artwork and a wordmark cut off at the edge
     * reads as a broken image. A partner with no logo shows its name set large
     * instead, which is a deliberate, plain fallback rather than an empty box.
     */
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo (optional)',
      admin: {
        description:
          'A PNG or SVG with a transparent or white background works best. It is shown whole, at its own shape -- nothing is cropped, so there is no need to make it square.',
      },
    },
    {
      name: 'website',
      type: 'text',
      label: 'Website (optional)',
      admin: {
        description: 'The full address, including https:// -- e.g. https://www.uwindsor.ca/',
      },
      validate: (value: unknown): string | true => {
        if (typeof value !== 'string' || value.trim() === '') return true
        return /^https?:\/\/\S+$/i.test(value.trim())
          ? true
          : 'Enter a full web address starting with http:// or https://'
      },
    },
    /**
     * Years, not dates. Nobody knows which day in 2019 a partnership with a
     * research council began, and a date field would force a guess and then
     * print it as fact. Two numbers say exactly as much as is known: one year
     * on its own, or a span.
     */
    {
      name: 'startYear',
      type: 'number',
      label: 'Year (or first year)',
      min: YEAR_MIN,
      max: YEAR_MAX,
      admin: {
        description:
          'Leave empty if the year isn\'t known. On its own it shows as a single year; fill in the one below as well to show a span.',
      },
    },
    {
      name: 'endYear',
      type: 'number',
      label: 'Last year (optional)',
      min: YEAR_MIN,
      max: YEAR_MAX,
      admin: {
        description: 'Only for a partnership that has ended, or one with an agreed end. Leave empty for an ongoing one.',
      },
      validate: (value: unknown, { siblingData }: { siblingData?: unknown }): string | true => {
        if (typeof value !== 'number') return true
        const start = (siblingData as { startYear?: unknown } | undefined)?.startYear
        if (typeof start !== 'number') return 'Fill in the first year before the last one.'
        return value >= start ? true : 'The last year cannot be before the first one.'
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Short Description (English, optional)',
      admin: {
        description:
          'A sentence or two on what the partnership covers. Leave it empty until there is something real to say -- the card reads fine without it.',
      },
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Short Description (Arabic / نبذة بالعربية)',
      admin: { rtl: true },
    },
  ],
}
