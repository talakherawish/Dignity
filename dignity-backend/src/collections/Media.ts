import type { CollectionConfig } from 'payload'

import { generatePdfThumbnail } from '../lib/pdfThumbnail'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Admin',
    description: 'All uploaded images and files across the whole site live here. You usually don\'t need to open this directly — upload from the "Image" or "File" field on the entry you\'re editing instead.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        readOnly: true,
        description: 'Auto-generated preview image (page 1) for PDF uploads. Left empty for non-PDF files.',
      },
    },
  ],
  upload: true,
  hooks: {
    beforeChange: [generatePdfThumbnail],
  },
}
