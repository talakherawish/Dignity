'use client'
import { Link, useConfig } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'

/**
 * The title column on a subject list (Databases, Readings and Documents).
 * Clicking a subject opens its items tab (SubjectEntriesView) -- that is what
 * an editor goes into a subject for. Its title and description are one tab
 * over, under "Edit". `tab` is the items tab's path, set per collection.
 */
export default function SubjectTitleCell({
  cellData,
  rowData,
  collectionSlug,
  tab,
}: DefaultCellComponentProps & { tab: string }) {
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()
  return (
    <Link href={`${admin}/collections/${collectionSlug}/${rowData.id}/${tab}`}>
      {String(cellData || rowData.id)}
    </Link>
  )
}
