import type { CollectionConfig } from 'payload'

/** Inbox the footer's "Subscribe" form notifies whenever someone joins the mailing list. */
const MAILING_LIST_INBOX = 'Dignity@birzeit.edu'

export const Recipients: CollectionConfig = {
  slug: 'recipients',
  admin: {
    group: 'Admin',
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'createdAt'],
    description:
      'Everyone who subscribed through the "Subscribe" form in the site footer. Select rows and use the list\'s Export action to download this as a spreadsheet.',
  },
  access: {
    // The footer form submits this unauthenticated, so anyone can create an
    // entry -- that's the whole point of a public signup form. Reading,
    // editing, and deleting the list stays staff-only.
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return

        // A failed notification shouldn't undo the signup -- the entry is
        // already saved and still visible (and exportable) from the admin
        // either way, so this only logs rather than throwing.
        try {
          await req.payload.sendEmail({
            to: MAILING_LIST_INBOX,
            subject: 'New mailing list subscriber',
            text: [
              `${doc.firstName} ${doc.lastName} wants to be added to the mailing list.`,
              '',
              `Email: ${doc.email}`,
              `Phone: ${doc.phone}`,
            ].join('\n'),
          })
        } catch (err) {
          req.payload.logger.error(`Failed to send mailing list notification email: ${err}`)
        }
      },
    ],
  },
}
