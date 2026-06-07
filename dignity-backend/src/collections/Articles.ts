import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'updatedAt'],
  },
  // Enable draft/publish — nothing goes live until content manager publishes
  versions: {
    drafts: true,
  },
  access: {
    // Anyone logged in can read (admin panel); public can only read published
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    // Editors assigned to 'articles' section + content managers can create
    create: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return Array.isArray(req.user.section) && req.user.section.includes('articles')
    },
    // Same as create
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return Array.isArray(req.user.section) && req.user.section.includes('articles')
    },
    // Only content managers can delete
    delete: ({ req }) => req.user?.role === 'content-manager',
  },
  fields: [
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
      requ