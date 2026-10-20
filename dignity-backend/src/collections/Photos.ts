import type { CollectionConfig } from 'payload'
import { mirrorLinksOnChange, mirrorLinksOnDelete } from '../hooks/syncResearchLinks'

export const Photos: CollectionConfig = {
  slug: 'photos',
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status'],
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [
      mirrorLinksOnChange({
        field: 'researchLines',
        relationTo: 'research',
        mirrorField: 'relatedPhotos',
      }),
    ],
    afterDelete: [mirrorLinksOnDelete({ relationTo: 'research', mirrorField: 'relatedPhotos' })],
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
      name: 'title',
      type: 'text',
      label: 'Title (English)',
    },
    {
      name: 'titleAr',
      type: 'text',
      label: 'Title (Arabic / العنوان بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        description: 'Optional. Shown under the caption when set.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Photo',
    },
    {
      name: 'relatedActivity',
      type: 'relationship',
      relationTo: 'forums',
      label: 'Related Activity (optional)',
    },
    {
      name: 'taggedParticipants',
      type: 'relationship',
      relationTo: 'participants',
      hasMany: true,
      label: 'Tagged People (optional)',
      admin: {
        description:
          'People shown in this photo. Pick them here, then place each one on the photo just below. Each tag links to their profile under About → Participants.',
      },
    },
    {
      name: 'tagPositions',
      type: 'json',
      label: 'Tags on the photo',
      admin: {
        components: { Field: '/components/admin/PhotoTagger' },
      },
      hooks: {
        // Drop spots for anyone no longer in Tagged People.
        beforeChange: [
          ({ value, siblingData }) => {
            if (!value || typeof value !== 'object') return null
            const tagged = new Set(
              (Array.isArray(siblingData?.taggedParticipants)
                ? siblingData.taggedParticipants
                : []
              ).map((person: unknown) =>
                String(person && typeof person === 'object' && 'id' in person ? person.id : person),
              ),
            )
            const kept = Object.fromEntries(
              Object.entries(value as Record<string, unknown>).filter(([id]) => tagged.has(id)),
            )
            return Object.keys(kept).length > 0 ? kept : null
          },
        ],
      },
    },
    {
      name: 'researchLines',
      type: 'relationship',
      relationTo: 'research',
      hasMany: true,
      label: 'Research Line(s)',
      admin: {
        position: 'sidebar',
        description:
          "Which research line(s) this photo is from. Shows up on that research line's page automatically.",
      },
    },
  ],
}
