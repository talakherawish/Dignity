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
      return req.user.section === 'participants'
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'content-manager') return true
      return req.user.section === 'participants'
    },
    delete: ({ req }) => req.user?.role === 'content-manager',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
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
      label: 'Job Title / Role',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
