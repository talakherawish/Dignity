import type { CollectionConfig, CollectionSlug, Field } from 'payload'
import { mirrorLinksOnChange, mirrorLinksOnDelete } from '../hooks/syncResearchLinks'

/**
 * The seven publication collections — one for each entry under Publications in
 * the website's navigation.
 *
 * These were a single `publications-items` collection carrying a `type` select,
 * so the sidebar showed one line ("Publications Items") where the site shows
 * seven pages, and choosing where an item belonged meant remembering to set a
 * dropdown rather than opening the section it was going into. The fields are
 * unchanged; only the `type` select is gone, because the collection an item
 * sits in now says what it is. Documents kept their ids through the split, so
 * every relationship pointing at them (see Research) still resolves.
 */

/** Shared by all seven — the field set the unified collection already used. */
function publicationFields(): Field[] {
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
      name: 'author',
      type: 'text',
      label: 'Author/Authors (English)',
    },
    {
      name: 'authorAr',
      type: 'text',
      label: 'Author/Authors (Arabic / المؤلف بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'date',
      type: 'date',
      label: 'Publication Date',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description (English)',
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Description (Arabic / الوصف بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'PDF or File',
      admin: {
        description:
          'Shown to readers in both languages. Leave this as the only file unless the Arabic version below is a genuinely different document.',
      },
    },
    {
      name: 'fileAr',
      type: 'upload',
      relationTo: 'media',
      label: 'PDF or File (Arabic only, if different / نسخة عربية مختلفة)',
      admin: {
        description:
          'Only needed when the Arabic file is a different document from the one above — a separate translation, say. Leave empty to show the same file to everyone.',
      },
    },
    {
      name: 'link',
      type: 'text',
      label: 'External Link (e.g. YouTube video)',
      admin: {
        description:
          'Use for items that live elsewhere rather than as an uploaded file — a YouTube video, for example. Leave empty when a file is attached above.',
      },
    },
    {
      name: 'linkAr',
      type: 'text',
      label: 'External Link (Arabic only, if different / رابط عربي مختلف)',
      admin: {
        rtl: true,
        description: 'Only needed when the Arabic destination differs from the link above.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover Image or Thumbnail',
    },
    {
      name: 'researchLines',
      type: 'relationship',
      relationTo: 'research',
      hasMany: true,
      label: 'Research Line(s)',
      admin: {
        position: 'sidebar',
        description: 'Which research line(s) this is an output of. Shows up on that research line\'s page automatically.',
      },
    },
  ]
}

/**
 * `researchField` is the matching `related*` field back on Research (see
 * OUTPUT_LINKS in Research.ts) -- it's what this collection's `researchLines`
 * field stays mirrored against, so an editor can attach the link from either
 * side. See src/hooks/syncResearchLinks.ts.
 */
function publicationCollection(
  slug: CollectionSlug,
  singular: string,
  plural: string,
  description: string,
  researchField: string,
): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Publications',
      useAsTitle: 'title',
      defaultColumns: ['title', 'date', 'author', 'updatedAt'],
      description,
    },
    versions: {
      drafts: true,
    },
    hooks: {
      afterChange: [mirrorLinksOnChange({ field: 'researchLines', relationTo: 'research', mirrorField: researchField })],
      afterDelete: [mirrorLinksOnDelete({ relationTo: 'research', mirrorField: researchField })],
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
    fields: publicationFields(),
  }
}

export const Books = publicationCollection(
  'books',
  'Book',
  'Books',
  'Shows on the website under Publications → Books.',
  'relatedBooks',
)

export const Papers = publicationCollection(
  'papers',
  'Paper',
  'Papers',
  'Shows on the website under Publications → Papers.',
  'relatedPapers',
)

export const Reports = publicationCollection(
  'reports',
  'Report',
  'Reports',
  'Shows on the website under Publications → Reports.',
  'relatedReports',
)

export const Brochures = publicationCollection(
  'brochures',
  'Brochure',
  'Brochures',
  'Shows on the website under Publications → Brochures.',
  'relatedBrochures',
)

export const Theses = publicationCollection(
  'theses',
  'Thesis',
  'Theses',
  'Shows on the website under Publications → Theses.',
  'relatedTheses',
)

export const Audiovisual = publicationCollection(
  'audiovisual',
  'Audiovisual Item',
  'Audiovisual',
  'Shows on the website under Publications → Audiovisual. Videos are usually a link rather than an upload.',
  'relatedAudiovisual',
)

export const Posters = publicationCollection(
  'posters',
  'Poster',
  'Posters',
  'Shows on the website under Publications → Posters.',
  'relatedPosters',
)
