'use client'
import { DefaultListView, useConfig, useDocumentInfo, useStepNav } from '@payloadcms/ui'
import type { ListViewClientProps } from 'payload'
import { useEffect } from 'react'

/**
 * Payload's own list view, as used on a database's Entries tab
 * (DatabaseEntriesView). Two changes:
 *
 * - "Create New" opens the entry form with this database already filled in
 *   (the `database` field reads ?database= as its default -- see
 *   src/collections/Bibliography.ts).
 * - The breadcrumb reads Databases › this database › Entries, rather than the
 *   Bibliography Entries list it would otherwise claim to be.
 */
export default function DatabaseEntriesList(props: ListViewClientProps) {
  const { id, title } = useDocumentInfo()
  const { setStepNav } = useStepNav()
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()

  useEffect(() => {
    setStepNav([
      { label: 'Databases', url: `${admin}/collections/databases` },
      { label: title || 'Database', url: `${admin}/collections/databases/${id}` },
      { label: 'Entries' },
    ])
  }, [setStepNav, admin, id, title])

  const newDocumentURL = `${props.newDocumentURL}?database=${encodeURIComponent(String(id))}`
  return <DefaultListView {...props} newDocumentURL={newDocumentURL} />
}
