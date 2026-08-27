import type { CollectionConfig } from 'payload'

/** Bio fields are free prose, but the card/modal on the site assumes a short paragraph. */
const MAX_BIO_WORDS = 200

function validateWordCount(value: unknown): string | true {
  if (typeof value !== 'string' || value.trim() === '') return true
  const wordCount = value.trim().split(/\s+/).length
  if (wordCount > MAX_BIO_WORDS) {
    return `Bio must be ${MAX_BIO_WORDS} words or fewer (currently ${wordCount}).`
  }
  return true
}

export const Participants: CollectionConfig = {
  slug: 'participants',
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'status'],
    description: 'Shows on the website under About the Dignity Initiative → Participants. Add a new entry here for each person.',
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
  hooks: {
    // New profiles default to visible on the site — an editor has to actively
    // choose "Save as draft" to hold one back, rather than remembering to hit
    // "Publish" before it appears. Drafts stay usable for anyone who does want
    // to hide a specific person; this only fills in what happens when no
    // status was set at all (e.g. an API-created record).
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data._status) {
          data._status = 'published'
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name (English)',
    },
    {
      name: 'nameAr',
      type: 'text',
      label: 'Name (Arabic / الاسم بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Role',
      required: true,
      options: [
        { label: 'Researcher', value: 'researcher' },
        { label: 'Visitor', value: 'visitor' },
        { label: 'Student', value: 'student' },
        { label: 'Speaker', value: 'speaker' },
        { label: 'Author', value: 'author' },
        { label: 'Team Member', value: 'team_member' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      label: 'Job Title / Role (English)',
    },
    {
      name: 'titleAr',
      type: 'text',
      label: 'Job Title / Role (Arabic / المسمى بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Bio (English)',
      validate: validateWordCount,
      admin: { description: `Up to ${MAX_BIO_WORDS} words.` },
    },
    {
      name: 'bioAr',
      type: 'textarea',
      label: 'Bio (Arabic / السيرة بالعربية)',
      admin: { rtl: true, description: `Up to ${MAX_BIO_WORDS} words.` },
      validate: validateWordCount,
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Photo (optional)',
    },
  ],
}
