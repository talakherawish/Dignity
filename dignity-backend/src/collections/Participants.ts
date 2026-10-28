import type { CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'
import { section } from '../lib/adminLayout'
import { uniqueSlug } from '../lib/slug'

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

/**
 * The Role dropdown: English, then the Arabic for a man and for a woman. A
 * role with both gets two entries, so a woman is named as one in Arabic; hers
 * is stored with "_f". The website keeps the same list (PARTICIPANT_ROLES in
 * its lib/payload.ts) -- add a role to both.
 */
const ROLES: [value: string, en: string, ar: string, arFemale?: string][] = [
  ['researcher', 'Researcher', 'باحث', 'باحثة'],
  ['senior_researcher', 'Senior Researcher', 'باحث رئيسي', 'باحثة رئيسية'],
  ['trainee_researcher', 'Trainee Researcher', 'باحث متدرب', 'باحثة متدربة'],
  ['visiting_researcher', 'Visiting Researcher', 'باحث زائر', 'باحثة زائرة'],
  ['researcher_coordinator', 'Researcher and Coordinator', 'باحث ومنسق', 'باحثة ومنسقة'],
  ['visiting_professor', 'Visiting Professor', 'أستاذ زائر', 'أستاذة زائرة'],
  ['fellow', 'Fellow', 'زميل', 'زميلة'],
  ['visitor', 'Visitor', 'زائر', 'زائرة'],
  ['student', 'Student', 'طالب', 'طالبة'],
  ['intern', 'Intern', 'متدرب', 'متدربة'],
  ['team_member', 'Team Member', 'عضو الفريق', 'عضوة الفريق'],
  ['practical_support', 'Practical Support', 'الدعم العملي'],
  ['speaker', 'Speaker', 'متحدث', 'متحدثة'],
  ['author', 'Author', 'مؤلف', 'مؤلفة'],
]

const ROLE_OPTIONS = ROLES.flatMap(([value, en, ar, arFemale]) => [
  { label: `${en} · ${ar}`, value },
  ...(arFemale ? [{ label: `${en} · ${arFemale}`, value: `${value}_f` }] : []),
])

/** Speakers and authors, either form -- kept off the Working Group page unless shown. */
export const SPEAKER_ROLES = ['speaker', 'speaker_f']
const isAuthorOrSpeaker = (category: unknown) =>
  typeof category === 'string' && /^(author|speaker)(_f)?$/.test(category)

/** What on this website credits a person: the field that names them, per collection. */
function creditedTo(relationTo: string, id: string | number | undefined): Where | boolean {
  if (!id) return false
  const names = { equals: id }
  if (relationTo === 'forums') return { participants: names }
  if (relationTo === 'photos') return { taggedParticipants: names }
  return { or: [{ authorParticipants: names }, { speakerParticipants: names }] }
}

const showWithFullPage = (data: Partial<Record<string, unknown>> | undefined) => data?.hasFullPage === true

/**
 * A full page's address comes from the English name, made unique by a number
 * if someone else already has it. Set once: changing it would break links
 * already shared.
 */
const fillSlug: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data || !(data.hasFullPage ?? originalDoc?.hasFullPage)) return data
  if (data.slug || originalDoc?.slug) return data
  const slug = await uniqueSlug(req, 'participants', data.name ?? originalDoc?.name, originalDoc?.id)
  if (slug) data.slug = slug
  return data
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
  // Drag to reorder in the list: the Working Group page shows people in this order.
  orderable: true,
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
    beforeValidate: [fillSlug],
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
        options: ROLE_OPTIONS,
      },
      {
        name: 'showOnWorkingGroupPage',
        type: 'checkbox',
        label: 'Show on Working Group Page',
        defaultValue: false,
        admin: {
          condition: (data) => isAuthorOrSpeaker(data?.category),
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
    // Optional. Everyone has the pop-up on the Working Group page; someone with
    // a lot to show also gets a page of their own, linked from the pop-up.
    section('Full Page', [
      {
        name: 'hasFullPage',
        type: 'checkbox',
        label: 'Give this person a full page',
        // Must stay false: see hideFromWorkingGroupPage above.
        defaultValue: false,
      },
      {
        name: 'slug',
        type: 'text',
        index: true,
        label: 'Page address',
        admin: {
          condition: showWithFullPage,
          description:
            'Filled in from the English name. Changing it after the page has been shared breaks the old link.',
        },
      },
      {
        name: 'fullBio',
        type: 'richText',
        label: 'Full Bio (English)',
        admin: {
          condition: showWithFullPage,
          description: 'Shown on the full page. Leave empty to use the short bio above.',
        },
      },
      {
        name: 'fullBioAr',
        type: 'richText',
        label: 'Full Bio (Arabic / السيرة الكاملة بالعربية)',
        admin: { condition: showWithFullPage },
      },
      {
        name: 'otherPublications',
        type: 'array',
        label: 'Publications Elsewhere',
        labels: { singular: 'Publication', plural: 'Publications' },
        admin: { condition: showWithFullPage, initCollapsed: false },
        fields: [
          { name: 'title', type: 'text', required: true, label: 'Title (English)' },
          { name: 'titleAr', type: 'text', label: 'Title (Arabic / العنوان بالعربية)', admin: { rtl: true } },
          {
            type: 'row',
            fields: [
              { name: 'publishedIn', type: 'text', label: 'Published In', admin: { width: '45%' } },
              { name: 'year', type: 'text', label: 'Year', admin: { width: '15%' } },
              { name: 'link', type: 'text', label: 'Link', admin: { width: '40%', placeholder: 'https://' } },
            ],
          },
        ],
      },
      // Everything on this website that credits them shows on their page by
      // itself; this takes single items off it. The picker only offers what
      // credits this person.
      {
        name: 'hiddenFromPage',
        type: 'relationship',
        relationTo: [
          'books',
          'papers',
          'reports',
          'brochures',
          'theses',
          'audiovisual',
          'posters',
          'forums',
          'photos',
        ],
        hasMany: true,
        label: 'Hide from Their Page',
        filterOptions: ({ id, relationTo }) => creditedTo(relationTo, id),
        admin: { condition: showWithFullPage },
      },
    ]),
  ],
}
