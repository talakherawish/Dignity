import type { CollectionConfig } from 'payload'
import { section } from '../lib/adminLayout'

/** Bio fields are free prose, but the card/modal on the site assumes a short paragraph. */
const MAX_BIO_WORDS = 350

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
  labels: {
    singular: 'Participant',
    plural: 'Working Group',
  },
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'status'],
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
    section('Name and Role', [
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
          { label: 'Intern', value: 'intern' },
          { label: 'Practical Support', value: 'practical_support' },
        ],
      },
      {
        name: 'showOnWorkingGroupPage',
        type: 'checkbox',
        label: 'Show on Working Group Page',
        defaultValue: false,
        admin: {
          condition: (data) => data?.category === 'author' || data?.category === 'speaker',
          description:
            'Authors and Speakers are hidden from the public Working Group page by default. Check this to show this person there too. Their profile stays reachable from the publications/photos that credit them either way.',
        },
      },
      /**
       * Kept off the public Working Group page without being unpublished.
       *
       * Unpublishing would have been the obvious way to hide someone, but a
       * draft is invisible to the public API altogether -- the person would
       * vanish from the forum that credits them as well as from this page,
       * which is the opposite of what's wanted for a conference speaker.
       *
       * **`defaultValue` must stay `false` here.** It was `true` for one
       * afternoon, on the reasoning that Payload fills a default in only when a
       * document is created, so the nine people already in the collection --
       * who have no value stored for this field -- would be unaffected. That is
       * wrong. The Mongo adapter applies schema defaults when it *hydrates* a
       * document, so every existing participant read back as hidden and the
       * public Working Group page went empty. Adding a field with a truthy
       * default to a populated collection is a retroactive change to every row
       * in it, whatever the stored data says.
       *
       * The cost is that a new person is listed on the page unless someone
       * checks this box -- including someone added from inside a Forum, who was
       * meant to start out hidden. That needs a mechanism that can tell a new
       * document from an old one, which a field default cannot.
       */
      {
        name: 'hideFromWorkingGroupPage',
        type: 'checkbox',
        label: 'Keep off the Working Group Page',
        defaultValue: false,
        admin: {
          description:
            'Check this to keep someone off the public Working Group page while still saving them -- a conference speaker, say, who stays reachable from the forum that credits them. Leave it unchecked and they are listed on About → Working Group.',
        },
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
    ]),
    section('Contact and Profiles', [
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
      },
      // Each row is a platform + URL; the site picks the icon from the platform
      // (see ProfileLinks.tsx in the frontend), so the two lists must match.
      {
        name: 'links',
        type: 'array',
        label: 'Links',
        labels: { singular: 'Link', plural: 'Links' },
        admin: { initCollapsed: false },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'platform',
                type: 'select',
                label: false,
                required: true,
                admin: { width: '30%' },
                options: [
                  { label: 'LinkedIn', value: 'linkedin' },
                  { label: 'Academia.edu', value: 'academia' },
                  { label: 'ORCID', value: 'orcid' },
                  { label: 'ResearchGate', value: 'researchgate' },
                  { label: 'Google Scholar', value: 'googleScholar' },
                  { label: 'Facebook', value: 'facebook' },
                  { label: 'YouTube', value: 'youtube' },
                  { label: 'Instagram', value: 'instagram' },
                  { label: 'X (Twitter)', value: 'x' },
                  { label: 'Website', value: 'website' },
                ],
              },
              {
                name: 'url',
                type: 'text',
                label: false,
                required: true,
                admin: { width: '70%', placeholder: 'https://' },
              },
            ],
          },
        ],
      },
    ]),
    section('Bio and Photo', [
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
    ]),
  ],
}
