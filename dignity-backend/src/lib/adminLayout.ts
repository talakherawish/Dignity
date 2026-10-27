import type { CollectionConfig, Field, GlobalConfig } from 'payload'

/**
 * How the admin's edit forms are laid out -- presentation only. Rows and
 * collapsible sections hold no data of their own, so wrapping fields in them
 * changes nothing that is saved or what the API returns.
 */

/** One part of a form under its own heading, open by default. */
export function section(label: string, fields: Field[]): Field {
  return { type: 'collapsible', label, admin: { initCollapsed: false }, fields }
}

// Rich text stays full width, one language above the other: its toolbar and
// long write-ups need the room.
const PAIRED_TYPES = new Set(['text', 'textarea', 'upload'])

type Named = { name?: string; type?: string; admin?: { position?: string; width?: string } }

function pairable(field: Field): boolean {
  const f = field as Named
  return !!f.name && !!f.type && PAIRED_TYPES.has(f.type) && f.admin?.position !== 'sidebar'
}

function half(field: Field): Field {
  const f = field as Named
  return { ...field, admin: { ...f.admin, width: '50%' } } as Field
}

/**
 * Every English field followed by its Arabic twin (`title` then `titleAr`)
 * becomes one row, English on the left and Arabic on the right, through
 * every section, tab, group and array. Fields already in a row are left as
 * their author arranged them.
 */
function pairFields(fields: Field[]): Field[] {
  const out: Field[] = []
  for (let i = 0; i < fields.length; i++) {
    const field = descend(fields[i])
    const next = fields[i + 1]
    const f = field as Named
    if (
      next &&
      pairable(field) &&
      pairable(next) &&
      (next as Named).name === `${f.name}Ar` &&
      (next as Named).type === f.type
    ) {
      out.push({ type: 'row', fields: [half(field), half(next)] })
      i++
    } else {
      out.push(field)
    }
  }
  return out
}

function descend(field: Field): Field {
  if (field.type === 'row') return field
  const container = field as { fields?: Field[]; tabs?: { fields: Field[] }[] }
  if (Array.isArray(container.fields)) return { ...field, fields: pairFields(container.fields) } as Field
  if (Array.isArray(container.tabs)) {
    return {
      ...field,
      tabs: container.tabs.map((tab) => ({ ...tab, fields: pairFields(tab.fields) })),
    } as Field
  }
  return field
}

export function sideBySide(collection: CollectionConfig): CollectionConfig {
  return { ...collection, fields: pairFields(collection.fields) }
}

export function sideBySideGlobal(global: GlobalConfig): GlobalConfig {
  return { ...global, fields: pairFields(global.fields) }
}
