import { renderListView } from '@payloadcms/next/views'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import type { CollectionSlug, DocumentViewServerProps } from 'payload'
import SubjectEntriesList from './SubjectEntriesList'

/**
 * The items tab on a subject -- "Entries" on a database, "Readings" on a
 * Readings and Documents subject: the full list of that subject's items --
 * search, filters, columns, select-and-delete, bulk edit, pagination. It is
 * Payload's own list view, rendered here with a base filter on the field that
 * ties an item to its subject, so nothing an editor does in it (clearing the
 * filters, say) can show another subject's items.
 *
 * Which items, and through which field, is set per collection as serverProps
 * in its config. The list is wrapped by SubjectEntriesList, which makes
 * "Create New" fill in this subject on the new item.
 */
export default async function SubjectEntriesView({
  doc,
  initPageResult,
  params,
  searchParams,
  items,
  field,
}: DocumentViewServerProps & { items: CollectionSlug; field: string }) {
  const id = doc?.id
  if (!id) return null
  const { req } = initPageResult
  const itemsConfig = req.payload.collections[items].config
  const collectionConfig = {
    ...itemsConfig,
    admin: { ...itemsConfig.admin, baseListFilter: () => ({ [field]: { equals: id } }) },
  }
  const clientConfig = getClientConfig({
    config: req.payload.config,
    i18n: req.i18n,
    importMap: req.payload.importMap,
    user: req.user ?? true,
  })
  const { List } = await renderListView({
    clientConfig,
    ComponentOverride: SubjectEntriesList,
    enableRowSelections: true,
    i18n: req.i18n,
    importMap: req.payload.importMap,
    initPageResult: { ...initPageResult, collectionConfig },
    overrideEntityVisibility: true,
    params,
    payload: req.payload,
    searchParams,
    viewType: 'list',
  })
  return List
}
