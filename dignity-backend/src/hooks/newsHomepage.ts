import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Field,
  FieldHook,
  PayloadRequest,
  Validate,
} from 'payload'
import { MAX_HOME_NEWS_CAROUSEL, MAX_HOME_NEWS_HEADLINES } from '../globals/SiteSettings'

/**
 * A news entry's place on the homepage, set from the entry itself.
 *
 * Site Settings -> Homepage holds the two lists the homepage shows -- the
 * photo carousel and the list of titles -- and stays the one place they are
 * stored. The entry's own Homepage section reads its place from those lists
 * and, when the entry is published, writes a change back into them, so the
 * two screens always show the same thing. Neither field is stored on the
 * entry (`virtual`).
 */

type Spot = 'withImage' | 'titleOnly'
type Picks = Record<Spot, string[]>

const LIST_FIELD = { withImage: 'homeNewsCarousel', titleOnly: 'homeNewsHeadlines' } as const
const MAX: Record<Spot, number> = {
  withImage: MAX_HOME_NEWS_CAROUSEL,
  titleOnly: MAX_HOME_NEWS_HEADLINES,
}
const isSpot = (value: unknown): value is Spot => value === 'withImage' || value === 'titleOnly'

const idOf = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : (value as { id?: string } | null)?.id

/** The homepage's two news lists, read once per request. */
async function readPicks(req: PayloadRequest): Promise<Picks> {
  const cached = req.context.homepageNewsPicks as Picks | undefined
  if (cached) return cached
  const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, req })
  const ids = (list: unknown) =>
    (Array.isArray(list) ? list : []).map(idOf).filter((id): id is string => !!id)
  const picks = {
    withImage: ids(settings.homeNewsCarousel),
    titleOnly: ids(settings.homeNewsHeadlines),
  }
  req.context.homepageNewsPicks = picks
  return picks
}

/** Where this entry is, for the form. Only worked out for the admin. */
const readSpot: FieldHook = async ({ data, req }) => {
  if (!req.user || !data?.id) return undefined
  const picks = await readPicks(req)
  if (picks.withImage.includes(data.id)) return 'withImage'
  if (picks.titleOnly.includes(data.id)) return 'titleOnly'
  return 'none'
}

const readPosition: FieldHook = async ({ data, req }) => {
  if (!req.user || !data?.id) return undefined
  const picks = await readPicks(req)
  for (const list of Object.values(picks)) {
    const index = list.indexOf(data.id)
    if (index >= 0) return index + 1
  }
  return null
}

const checkSpot: Validate = async (value, { req, data, id }) => {
  if (!isSpot(value)) return true
  if (value === 'withImage' && !(data as { image?: unknown })?.image) {
    return 'Add a cover image first -- the photo carousel shows each entry with its image.'
  }
  const others = (await readPicks(req))[value].filter((pick) => pick !== id)
  if (others.length >= MAX[value]) {
    const where = value === 'withImage' ? 'photo carousel' : 'list of titles'
    return `The ${where} already has ${MAX[value]} entries. Take one off first, here or in Site Settings → Homepage.`
  }
  return true
}

export const homepageFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'homepageSpot',
        type: 'select',
        virtual: true,
        label: 'Show on the Homepage',
        // No defaultValue: Payload would fill it in on every save that doesn't
        // mention it -- an import, a bulk edit -- and take the entry off the
        // homepage. readSpot shows 'none' in the form instead.
        options: [
          { label: 'Not on the homepage', value: 'none' },
          { label: `With Image (photo carousel, up to ${MAX_HOME_NEWS_CAROUSEL})`, value: 'withImage' },
          { label: `Title Only (list, up to ${MAX_HOME_NEWS_HEADLINES})`, value: 'titleOnly' },
        ],
        validate: checkSpot,
        hooks: { afterRead: [readSpot] },
        admin: { width: '70%' },
      },
      {
        name: 'homepagePosition',
        type: 'number',
        virtual: true,
        label: 'Position (1 = first)',
        min: 1,
        hooks: { afterRead: [readPosition] },
        admin: {
          width: '30%',
          condition: (_, siblingData) => isSpot(siblingData?.homepageSpot),
        },
      },
    ],
  },
]

/**
 * Writes the entry's place into Site Settings once it is published -- the
 * homepage only ever shows published entries, and Site Settings only accepts
 * published ones. Picks that are no longer published (or carousel picks that
 * lost their image) are dropped on the way, since Site Settings would refuse
 * to save them.
 */
export const syncHomepagePlace: CollectionAfterChangeHook = async ({ doc, data, req }) => {
  // Only a save that says where the entry goes changes anything. Payload
  // lists every field in `data` on an update, this one as undefined when it
  // wasn't sent, so presence alone means nothing.
  const spot = data?.homepageSpot
  if (spot === undefined || spot === null || doc._status !== 'published') return doc

  const current = await readPicks(req)
  const next: Picks = {
    withImage: current.withImage.filter((id) => id !== doc.id),
    titleOnly: current.titleOnly.filter((id) => id !== doc.id),
  }
  if (isSpot(spot)) {
    const list = next[spot]
    const position = Number(data.homepagePosition)
    const at = position >= 1 ? Math.min(position - 1, list.length) : list.length
    list.splice(at, 0, doc.id)
  }
  if (JSON.stringify(next) === JSON.stringify(current)) return doc

  const { docs } = await req.payload.find({
    collection: 'news',
    where: {
      id: { in: [...next.withImage, ...next.titleOnly] },
      _status: { equals: 'published' },
    },
    depth: 0,
    pagination: false,
    select: { image: true },
    req,
  })
  const published = new Map(docs.map((entry) => [entry.id, !!entry.image]))
  const clean: Picks = {
    withImage: next.withImage.filter((id) => published.get(id) === true).slice(0, MAX.withImage),
    titleOnly: next.titleOnly.filter((id) => published.has(id)).slice(0, MAX.titleOnly),
  }

  await req.payload.updateGlobal({
    slug: 'site-settings',
    data: { [LIST_FIELD.withImage]: clean.withImage, [LIST_FIELD.titleOnly]: clean.titleOnly },
    depth: 0,
    req,
  })
  req.context.homepageNewsPicks = clean
  return doc
}

/** A deleted entry comes off the homepage too. */
export const removeFromHomepage: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const current = await readPicks(req)
  if (!current.withImage.includes(doc.id) && !current.titleOnly.includes(doc.id)) return doc
  const clean: Picks = {
    withImage: current.withImage.filter((id) => id !== doc.id),
    titleOnly: current.titleOnly.filter((id) => id !== doc.id),
  }
  await req.payload.updateGlobal({
    slug: 'site-settings',
    data: { [LIST_FIELD.withImage]: clean.withImage, [LIST_FIELD.titleOnly]: clean.titleOnly },
    depth: 0,
    req,
  })
  req.context.homepageNewsPicks = clean
  return doc
}
