import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  Field,
  GlobalBeforeChangeHook,
  GlobalConfig,
} from 'payload'

/**
 * "Last Edited By" (and, on collections, "Created By"): who saved a document,
 * set automatically -- Payload's own version history tracks *when* a
 * document changed but not *who* changed it. Real (non-virtual) fields, not
 * computed on read, so each version snapshot carries the editor who made
 * that particular save, not just the current one.
 *
 * Applied centrally in payload.config.ts, the same way enforceBilingual and
 * withPublicationStatus are, so every collection/global gets it
 * automatically. Silently does nothing when there's no logged-in user --
 * the migration scripts under scripts/ run through the Local API with no
 * `user`, and their writes shouldn't be attributed to whichever editor
 * happens to be first to save the document afterward.
 */

function trackingField(name: string, label: string): Field {
  return {
    name,
    type: 'relationship',
    relationTo: 'users',
    label,
    // Admin-only -- an anonymous visitor's read of a published document
    // (which is what the public website's API calls are) has no business
    // seeing who on staff last touched it.
    access: {
      read: ({ req }) => !!req.user,
    },
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: `Set automatically -- not editable by hand.`,
    },
  }
}

const collectionBeforeChange: CollectionBeforeChangeHook = ({ data, req, operation }) => {
  if (!req.user) return data
  data.updatedBy = req.user.id
  if (operation === 'create') data.createdBy = req.user.id
  return data
}

export function withEditTracking(collection: CollectionConfig): CollectionConfig {
  return {
    ...collection,
    fields: [
      ...collection.fields,
      trackingField('updatedBy', 'Last Edited By'),
      trackingField('createdBy', 'Created By'),
    ],
    hooks: {
      ...collection.hooks,
      beforeChange: [...(collection.hooks?.beforeChange ?? []), collectionBeforeChange],
    },
  }
}

const globalBeforeChange: GlobalBeforeChangeHook = ({ data, req }) => {
  if (!req.user) return data
  data.updatedBy = req.user.id
  return data
}

/** Globals have no real "creation" moment of their own -- just the one document, always being updated. */
export function withEditTrackingGlobal(global: GlobalConfig): GlobalConfig {
  return {
    ...global,
    fields: [...global.fields, trackingField('updatedBy', 'Last Edited By')],
    hooks: {
      ...global.hooks,
      beforeChange: [...(global.hooks?.beforeChange ?? []), globalBeforeChange],
    },
  }
}
