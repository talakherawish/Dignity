import type { CollectionConfig } from 'payload'

import { generatePdfThumbnail, trackManualThumbnail } from '../lib/pdfThumbnail'

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
        description: 'Preview image shown on the site for PDF uploads (auto-generated from page 1). Left empty for non-PDF files. Pick a different image here to override the auto-generated one.',
      },
    },
    {
      // Tracks whether `thumbnail` is the auto-generated page-1 render or
      // something an editor picked by hand — see trackManualThumbnail and
      // generatePdfThumbnail in lib/pdfThumbnail.ts. Not editor-facing.
      name: 'thumbnailIsAuto',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true,
      },
    },
  ],
  upload: true,
  hooks: {
    beforeChange: [trackManualThumbnail],
    afterChange: [generatePdfThumbnail],
  },
}
