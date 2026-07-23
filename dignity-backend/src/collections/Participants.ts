import type { CollectionConfig } from 'payload'

export const Participants: CollectionConfig = {
  slug: 'participants',
  admin: {
    group: 'About the Dignity Initiative',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'category', 'status'],
    description: 'Shows on the website under About the Dignity Initiative → Participants. Add a new entry here for each person.',
  },
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
