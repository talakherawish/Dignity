import type { Access } from 'payload'

/**
 * Blocks creating a second document in a collection meant to hold exactly
 * one -- About Initiative, Partners (AboutPages.ts), Task Force on AI, Idea
 * Factory (ActivityLines.ts), and Windsor-Birzeit (WindsorDignity.ts). Each
 * already said as much in its own comments ("holds a single document --
 * edit the one that's there rather than adding another"); this actually
 * enforces it, rather than just asking nicely. Editing the existing document
 * is untouched -- this only blocks creating a duplicate, by mistake or via
 * the API directly.
 *
 * Pair with `singletonListView` below on the same collection, which sends an
 * admin straight to that one document (or its create form, if there isn't
 * one yet) instead of the normal list-with-a-Create-button screen -- so in
 * practice this guard is a backstop, not the first line of defense.
 */
export function singletonCreateAccess(slug: string): Access {
  return async ({ req }) => {
    if (!req.user) return false
    const { totalDocs } = await req.payload.count({ collection: slug as any, overrideAccess: true })
    return totalDocs === 0
  }
}

/**
 * `admin.components.views.list` override for a singleton collection -- see
 * `singletonCreateAccess` above and `src/components/admin/SingletonListView.tsx`.
 */
export const singletonListView = {
  Component: '/components/admin/SingletonListView',
}
