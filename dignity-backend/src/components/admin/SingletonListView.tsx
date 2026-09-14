import { redirect } from 'next/navigation'
import type { ListViewServerProps } from 'payload'

/**
 * `admin.components.views.list` override for a collection meant to hold
 * exactly one document (About Initiative, Partners, Task Force on AI, Idea
 * Factory, Windsor-Birzeit -- see singletonCreateAccess in
 * src/lib/singleton.ts for the matching write-side guard).
 *
 * The normal list view -- "No Results." plus a Create New button -- makes no
 * sense here: there's only ever one document (or, before an editor has
 * touched it, none). This sends the admin straight to that document's edit
 * form, or straight to its create form when it doesn't exist yet, instead of
 * making them click through a list that can never hold more than one row.
 */
export default async function SingletonListView({
  collectionSlug,
  newDocumentURL,
  payload,
  user,
}: ListViewServerProps) {
  const { docs } = await payload.find({
    collection: collectionSlug,
    limit: 1,
    depth: 0,
    user,
    overrideAccess: false,
  })

  const existing = docs[0]
  redirect(existing ? newDocumentURL.replace(/\/create$/, `/${existing.id}`) : newDocumentURL)
}
