import type { CollectionConfig } from 'payload'

/**
 * The institutions the initiative works with, one document each, shown as a
 * wall of logos on About -> Partners.
 *
 * This was briefly two collections: this one, and a single prose document in
 * AboutPages.ts holding the page's heading and a one-line introduction. Two
 * sidebar entries for one page confused everyone who went looking for where to
 * add a partner, whatever they were labelled, so the prose page is gone and
 * this is the whole of Partners. The page is its heading and these
 * institutions.
 *
 * **The slug is `partner-items`, not `partners`, and has to stay that way.**
 * A slug is the name of the MongoDB collection behind it, so renaming this one
 * to `partners` does not carry the documents across -- it points the code at
 * a different, older collection (the retired prose page's) and strands every
 * partner already entered. That was tried, and the live Partners page went
 * from two institutions to none.
 *
 * The retired prose document is still in the `partners` collection in Mongo,
 * the same way the merged Seminars / Conferences / Meetings data is still
 * under its old names. Nothing is registered at that slug any more, so it is
 * unreachable and invisible rather than something to tidy up.
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

export const Partners: CollectionConfig = {
  // See the note above: this cannot be renamed to 'partners' without moving
  // the documents in Mongo first.
  slug: 'partner-items',
  labels: { singular: 'Partner', plural: 'Partners' },
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'name',
    defaultColumns: ['name', 'startYear', 'endYear', 'status', 'updatedAt'],
    description:
      'The institutions shown on the website under About the Dignity Initiative → Partners. One entry per institution. Only the name is required; add the logo, the website and the years when you have them.',
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
