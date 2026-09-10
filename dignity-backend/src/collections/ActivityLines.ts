import type { CollectionConfig, Field } from 'payload'

/**
 * Task Force on AI and Idea Factory each get their own collection here,
 * appearing as siblings of Research/Forums/The Windsor Birzeit Dignity
 * Initiative under Activities in the admin sidebar -- not a field bolted
 * onto Forums/Publications, which put nothing under either page's own name
 * in the admin at all.
 *
 * Each item is tagged Activities or Publications via `parentCategory`; the
 * page for that activity line splits on that field into two collapsible
 * sections, both newest first.
 */
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
      name: 'parentCategory',
      type: 'select',
      required: true,
      label: 'Section',
      options: [
        { label: 'Activities', value: 'activities' },
        { label: 'Publications', value: 'publications' },
      ],
      admin: {
        description: 'Which collapsible section this item shows under on the page.',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
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
      label: 'Image (optional)',
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'PDF or File (optional)',
      admin: {
        description: 'For a Publications item with a document to download.',
      },
    },
    {
      name: 'fileAr',
      type: 'upload',
      relationTo: 'media',
      label: 'PDF or File (Arabic only, if different / نسخة عربية مختلفة)',
    },
    {
      name: 'link',
      type: 'text',
      label: 'External Link (e.g. YouTube video)',
      admin: {
        description: 'Use for items that live elsewhere rather than as an uploaded file.',
      },
    },
    {
      name: 'linkAr',
      type: 'text',
      label: 'External Link (Arabic only, if different / رابط عربي مختلف)',
      admin: { rtl: true },
    },
  ]
}

function activityLineCollection(
  slug: string,
  singular: string,
  plural: string,
  description: string,
): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Activities',
      useAsTitle: 'title',
      defaultColumns: ['title', 'parentCategory', 'date', 'status'],
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
      create: ({ req }) => !!req.user,
      update: ({ req }) => !!req.user,
      delete: ({ req }) => !!req.user,
    },
    fields: activityLineFields(),
  }
}

export const TaskForceAI = activityLineCollection(
  'task-force-ai',
  'Task Force on AI Item',
  'Task Force on AI',
  'Shows on the website under Activities → Task Force on AI. The Section field below splits items into that page\'s Activities and Publications sections.',
)

export const IdeaFactory = activityLineCollection(
  'idea-factory',
  'Idea Factory Item',
  'Idea Factory',
  'Shows on the website under Activities → Idea Factory. The Section field below splits items into that page\'s Activities and Publications sections.',
)
