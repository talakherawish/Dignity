import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    group: 'Admin',
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
      admin: {
        description: 'Content Managers can manage Users and Pages. Editors can create/edit/delete everything else.',
      },
      options: [
        { label: 'Content Manager', value: 'content-manager' },
        { label: 'Editor', value: 'editor' },
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
