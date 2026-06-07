import type { CollectionConfig } from 'payload'

export const Participants: CollectionConfig = {
  slug: 'participants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'category', 'status'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return Array.isArray(req.user.section) && req.user.section.includes('participants')
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return Array.isArray(req.user.section) && req.user.section.includes('participants')
    },
    delete: ({ req }) => req.user?.role === 'content-manager',
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
      required: true,
      options: [
        { label: 'Faculty', value: 'faculty' },
        { label: 'Researcher', value: 'researcher' },
        { label: 'Intern', value: 'intern' },
        { label: 'Student', value: 'student' },
        { label: 'Visitor', value: 'visitor' },
      ],
    },
  