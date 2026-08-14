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
      // Only a content manager can change a role — the collection's own
      // update access is wide open below, and without this an editor could
      // promote themselves to content-manager and grant themselves the one
      // thing they're meant to stay locked out of.
      access: {
        update: ({ req }) => req.user?.role === 'content-manager',
      },
      admin: {
        description:
          'Only a Content Manager can change this. Editors can do everything else — including editing other users\' profiles — except add or remove accounts.',
      },
      options: [
        { label: 'Content Manager', value: 'content-manager' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
  // Adding and removing accounts is the one thing kept content-manager-only;
  // everything else on the site, including editing another user's profile,
  // is open to editors too.
  access: {
    create: ({ req }) => req.user?.role === 'content-manager',
    delete: ({ req }) => req.user?.role === 'content-manager',
    read: () => true,
    update: ({ req }) => !!req.user,
  },
}
