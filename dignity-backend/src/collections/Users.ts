import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Content Manager', value: 'content-manager' },
        { label: 'Editor', value: 'editor' },
      ],
    },
    {
      name: 'section',
      type: 'select',
      label: 'Assigned Section',
      // Only relevant for editors — which section they can manage
      admin: {
        condition: (data) => data.role === 'editor',
        description: 'The section this editor is allowed to manage.',
      },
      options: [
        { label: 'Articles', value: 'articles' },
        { label: 'Activities', value: 'activities' },
        { label: 'Media & Updates', value: 'media' },
        { label: 'Participants', value: 'participants' },
      ],
    },
  ],
  // Only content managers can create or delete users
  access: {
    create: ({ req }) => req.user?.role === 'content-manager',
    delete: ({ req }) => req.user?.role === 'content-manager',
    read: () => true,
    update: ({ req, id }) => {
      // Content managers can update anyone; editors can only update themselves
      if (req.user?.role === 'content-manager') return true
      return req.user?.id === id
    },
  },
}
