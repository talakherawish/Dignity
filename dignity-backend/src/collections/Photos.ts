import type { CollectionConfig } from 'payload'
import { mirrorLinksOnChange, mirrorLinksOnDelete } from '../hooks/syncResearchLinks'

export const Photos: CollectionConfig = {
  slug: 'photos',
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status'],
    description: 'Shows on the website under About the Dignity Initiative → Photos. Upload one photo per entry (click the Image field below to upload).',
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [mirrorLinksOnChange({ field: 'researchLines', relationTo: 'research', mirrorField: 'relatedPhotos' })],
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
      admin: {
        description:
          'Optional caption, e.g. "Seminar on Dignity and Praxis, March 2026". A photo that speaks for itself can be left untitled — the gallery just shows the picture.',
      },
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
      admin: {
        description:
          'If this photo is from a specific seminar, roundtable, workshop, or conference, link it here — the gallery will show an "Enter" link to that activity.',
      },
    },
    {
      name: 'taggedParticipants',
      type: 'relationship',
      relationTo: 'participants',
      hasMany: true,
      label: 'Tagged People (optional)',
      admin: {
        description:
          'People shown in this photo. Each one appears as a clickable tag linking to their profile under About → Participants.',
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
        description: 'Which research line(s) this photo is from. Shows up on that research line\'s page automatically.',
      },
    },
  ],
}
