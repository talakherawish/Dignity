'use client'
import { Link, useConfig } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'

/**
 * The title column on the Databases list. Clicking a database opens its
 * entries table (the Entries tab, DatabaseEntriesView) -- that is what an
 * editor goes into a database for. Its title and description are one tab
 * over, under "Edit".
 */
export default function DatabaseTitleCell({ cellData, rowData }: DefaultCellComponentProps) {
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()
  return (
    <Link href={`${admin}/collections/databases/${rowData.id}/entries`}>
      {String(cellData || rowData.id)}
    </Link>
  )
}
