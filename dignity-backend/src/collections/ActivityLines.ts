import type { CollectionConfig, CollectionSlug, Field } from 'payload'
import { mirrorLinksOnChange, mirrorLinksOnDelete } from '../hooks/syncResearchLinks'

/**
 * Task Force on AI and Idea Factory, each shaped like a Research line: a
 * title and its own write-up, plus the real Forums/Publications items
 * attached to it -- not freestanding items typed fresh under either page,
 * and not a field buried inside Forums/Publications either. Each is its own
 * collection (a sibling of Research/Forums under Activities in the admin,
 * not an entry inside Research's own list), holding a single document the
 * same way AboutPages.ts's two pages do -- edit the one that's there rather
 * than adding another.
 *
 * The outputs use the exact relationship+mirror pattern Research already
 * uses for its own (see OUTPUT_LINKS in Research.ts and
 * src/hooks/syncResearchLinks.ts), just collapsed into the two sections the
 * page shows -- Activities (relatedForums) and Publications (the other
 * seven combined) -- instead of Research's ten separate ones.
 */
const ACTIVITY_LINE_OUTPUTS = [
  { field: 'relatedForums', relationTo: 'forums' },
  { field: 'relatedBooks', relationTo: 'books' },
  { field: 'relatedPapers', relationTo: 'papers' },
  { field: 'relatedReports', relationTo: 'reports' },
  { field: 'relatedBrochures', relationTo: 'brochures' },
  { field: 'relatedTheses', relationTo: 'theses' },
  { field: 'relatedAudiovisual', relationTo: 'audiovisual' },
  { field: 'relatedPosters', relationTo: 'posters' },
] as const satisfies { field: string; relationTo: CollectionSlug }[]

function activityLineFields(): Field[] {
  return [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Title (English)',
    },
    {
      name: 'titleAr',
      type: 'text',
      label: 'Title (Arabic / العنوان بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Short Description (English)',
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Short Description (Arabic / الوصف بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Full Content (English)',
    },
    {
      name: 'contentAr',
      type: 'richText',
      label: 'Full Content (Arabic / المحتوى بالعربية)',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured Image',
    },
    // The outputs, shown on the page beneath the write-up. Each points at the
    // collection that already holds those items, so nothing is duplicated --
    // an item is uploaded once (under Forums or a Publications type) and
    // attached here, same as Research's own related* fields.
    {
      name: 'relatedForums',
      type: 'relationship',
      relationTo: 'forums',
      hasMany: true,
      label: 'Activities (Forums)',
      admin: {
        description:
          'Seminars, roundtables, workshops, and conferences related to this. Shown under this page\'s Activities section.',
      },
    },
    {
      name: 'relatedBooks',
      type: 'relationship',
      relationTo: 'books',
      hasMany: true,
      label: 'Books',
    },
    {
      name: 'relatedPapers',
      type: 'relationship',
      relationTo: 'papers',
      hasMany: true,
      label: 'Papers',
    },
    {
      name: 'relatedReports',
      type: 'relationship',
      relationTo: 'reports',
      hasMany: true,
      label: 'Reports',
    },
    {
      name: 'relatedBrochures',
      type: 'relationship',
      relationTo: 'brochures',
      hasMany: true,
      label: 'Brochures',
    },
    {
      name: 'relatedTheses',
      type: 'relationship',
      relationTo: 'theses',
      hasMany: true,
      label: 'Theses',
    },
    {
      name: 'relatedAudiovisual',
      type: 'relationship',
      relationTo: 'audiovisual',
      hasMany: true,
      label: 'Audiovisual',
    },
    {
      name: 'relatedPosters',
      type: 'relationship',
      relationTo: 'posters',
      hasMany: true,
      label: 'Posters',
    },
  ]
}

/**
 * `mirrorField` is the field on Forums/Books/Papers/.../Posters that mirrors
 * this collection's `related*` fields back -- see the matching field added
 * to Forums.ts and to Publications.ts's shared field factory.
 */
function activityLineCollection(
  slug: string,
  singular: string,
  plural: string,
  description: string,
  mirrorField: string,
): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Activities',
      useAsTitle: 'title',
      defaultColumns: ['title', 'status', 'updatedAt'],
      description,
    },
    versions: {
      drafts: true,
    },
    hooks: {
      afterChange: ACTIVITY_LINE_OUTPUTS.map(({ field, relationTo }) =>
        mirrorLinksOnChange({ field, relationTo, mirrorField }),
      ),
      afterDelete: ACTIVITY_LINE_OUTPUTS.map(({ relationTo }) =>
        mirrorLinksOnDelete({ relationTo, mirrorField }),
      ),
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
    fields: activityLineFields(),
  }
}

export const TaskForceAI = activityLineCollection(
  'task-force-ai',
  'Task Force on AI',
  'Task Force on AI',
  'Shows on the website under Activities → Task Force on AI. Holds a single document -- edit the one that\'s there rather than adding another. The Forums/Publications selected below appear on its page, split into Activities and Publications.',
  'taskForceAILines',
)

export const IdeaFactory = activityLineCollection(
  'idea-factory',
  'Idea Factory',
  'Idea Factory',
  'Shows on the website under Activities → Idea Factory. Holds a single document -- edit the one that\'s there rather than adding another. The Forums/Publications selected below appear on its page, split into Activities and Publications.',
  'ideaFactoryLines',
)
