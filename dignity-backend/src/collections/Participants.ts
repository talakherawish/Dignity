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
    },
    {
      name: 'bioAr',
      type: 'textarea',
      label: 'Bio (Arabic / السيرة بالعربية)',
      admin: { rtl: true },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
