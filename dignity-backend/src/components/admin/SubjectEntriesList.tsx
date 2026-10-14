'use client'
import { DefaultListView, useConfig, useDocumentInfo, useStepNav } from '@payloadcms/ui'
import type { ListViewClientProps } from 'payload'
import { useEffect } from 'react'

/**
 * Payload's own list view, as used on a subject's items tab
 * (SubjectEntriesView). Two changes:
 *
 * - "Create New" opens the item form with this subject already filled in:
 *   the form address carries ?subject=<id>, which the item's subject field
 *   (`database` on entries, `subject` on readings) reads as its default.
 * - The breadcrumb reads e.g. Databases › this database › Entries, rather than
 *   the plain items list it would otherwise claim to be.
 */
export default function SubjectEntriesList(props: ListViewClientProps) {
  const { id, title, collectionSlug } = useDocumentInfo()
  const { setStepNav } = useStepNav()
  const {
    config: {
      routes: { admin },
    },
    getEntityConfig,
  } = useConfig()
  const subjects = getEntityConfig({ collectionSlug: collectionSlug! })
  const plural = subjects?.labels?.plural
  const items = getEntityConfig({ collectionSlug: props.collectionSlug })?.labels?.plural

  useEffect(() => {
    setStepNav([
      {
        label: typeof plural === 'string' ? plural : 'Subjects',
        url: `${admin}/collections/${collectionSlug}`,
      },
      { label: title || 'Subject', url: `${admin}/collections/${collectionSlug}/${id}` },
      { label: typeof items === 'string' ? items : 'Items' },
    ])
  }, [setStepNav, admin, collectionSlug, plural, items, id, title])

  const newDocumentURL = `${props.newDocumentURL}?subject=${encodeURIComponent(String(id))}`
  return <DefaultListView {...props} newDocumentURL={newDocumentURL} />
}
