import type { CollectionConfig } from 'payload'
import { section } from '../lib/adminLayout'
import { homepageFields, removeFromHomepage, syncHomepagePlace } from '../hooks/newsHomepage'

export const News: CollectionConfig = {
  slug: 'news',
  labels: {
    singular: 'News & Announcement',
    plural: 'News & Announcements',
  },
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'updatedAt'],
  },
  // Enable draft/publish — nothing goes live until content manager publishes
  versions: {
    drafts: true,
  },
  // The entry's own Homepage section edits the homepage lists in Site
  // Settings -- see src/hooks/newsHomepage.ts.
  hooks: {
    afterChange: [syncHomepagePlace],
    afterDelete: [removeFromHomepage],
  },
  access: {
    // Anyone logged in can read (admin panel); public can only read published
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    // Any logged-in user can create
    create: ({ req }) => !!req.user,
    // Any logged-in user can update
    update: ({ req }) => !!req.user,
    // Any logged-in user can delete
    delete: ({ req }) => !!req.user,
  },
  fields: [
    section('Title and Date', [
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
        name: 'date',
        type: 'date',
        required: true,
      },
    ]),
    section('Summary and Write-up', [
      {
        name: 'excerpt',
        type: 'textarea',
        label: 'Short Summary (English)',
      },
      {
        name: 'excerptAr',
        type: 'textarea',
        label: 'Short Summary (Arabic / الملخص بالعربية)',
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
    ]),
    section('Cover Image', [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        label: 'Cover Image',
      },
    ]),
    section('Homepage', homepageFields),
  ],
}
