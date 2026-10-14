import { renderListView } from '@payloadcms/next/views'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import type { DocumentViewServerProps } from 'payload'
import DatabaseEntriesList from './DatabaseEntriesList'

/**
 * The "Entries" tab on a database: the full Bibliography Entries list -- search,
 * filters, columns, select-and-delete, bulk edit, pagination -- limited to this
 * one database. It is Payload's own list view, rendered here with a base filter
 * on `database`, so nothing an editor does in it (clearing the filters, say)
 * can show another database's entries.
 *
 * The list is wrapped by DatabaseEntriesList, which makes "Create New" fill in
 * this database on the new entry.
 */
export default async function DatabaseEntriesView({
  doc,
  initPageResult,
  params,
  searchParams,
}: DocumentViewServerProps) {
  const id = doc?.id
  if (!id) return null
  const { req } = initPageResult
  const entries = req.payload.collections['bibliography-entries'].config
  const collectionConfig = {
    ...entries,
    admin: { ...entries.admin, baseListFilter: () => ({ database: { equals: id } }) },
  }
  const clientConfig = getClientConfig({
    config: req.payload.config,
    i18n: req.i18n,
    importMap: req.payload.importMap,
    user: req.user ?? true,
  })
  const { List } = await renderListView({
    clientConfig,
    ComponentOverride: DatabaseEntriesList,
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
