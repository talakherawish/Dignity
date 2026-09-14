/**
 * Merge every collection's separate `description` (short, plain textarea)
 * field into its `content`/`body` (full write-up, Lexical richText) field,
 * so editors type one continuous piece of prose instead of two. The website
 * side of this (rendering the merged field in the description's smaller,
 * muted font instead of the write-up's heavier one, across About, Partners,
 * Idea Factory, Task Force on AI, Research, and Forums) lands separately;
 * this script only touches data, and the description/descriptionAr fields
 * stay in the schema until this has run everywhere it needs to.
 *
 * The description's text becomes the opening paragraph(s) of the merged
 * field -- split on blank lines, one Lexical paragraph node each -- followed
 * by whatever was already in content/body. A document with only one of the
 * two ends up with just that one, unchanged in substance.
 *
 * Every document touched is written to a local JSON backup (its pre-merge
 * description/content/body values only) before it's updated, so the
 * original text can be recovered if anything here needs to be undone.
 * Uses payload.update (not raw Mongo) so drafts/versions stay consistent.
 * Safe to run twice: a document with an already-empty description field is
 * left untouched the second time.
 *
 *   npm run payload -- run scripts/merge-description-into-content.ts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs'
import path from 'path'

const BACKUP_DIR =
  process.env.MERGE_BACKUP_DIR ||
  'C:/Users/tala/AppData/Local/Temp/claude/C--Users-tala-Projects-dignity-academic-hub/a694b537-7fc0-4150-9400-d12d6a6d7125/scratchpad'

type Target = { slug: string; bodyField: string }

const TARGETS: Target[] = [
  { slug: 'about-initiative', bodyField: 'body' },
  { slug: 'partners', bodyField: 'body' },
  { slug: 'task-force-ai', bodyField: 'content' },
  { slug: 'idea-factory', bodyField: 'content' },
  { slug: 'research', bodyField: 'content' },
  { slug: 'forums', bodyField: 'content' },
  { slug: 'windsor-dignity', bodyField: 'content' },
]

type TextNode = {
  type: 'text'
  format: number
  style: string
  mode: string
  detail: number
  text: string
  version: number
}
type ParagraphNode = {
  type: 'paragraph'
  format: string
  indent: number
  version: number
  direction: string | null
  children: TextNode[]
  textFormat?: number
  textStyle?: string
}

function textNode(text: string): TextNode {
  return { type: 'text', format: 0, style: '', mode: 'normal', detail: 0, text, version: 1 }
}

function paragraphsFromPlainText(value: string): ParagraphNode[] {
  return value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: [textNode(p)],
    }))
}

/** Same check as the frontend's `hasProse` -- true when a Lexical value has at least one text node. */
function hasProseLexical(value: unknown): value is { root: { children: unknown[] } } {
  if (!value || typeof value !== 'object') return false
  const root = (value as any).root
  const children = root?.children
  if (!Array.isArray(children) || children.length === 0) return false
  return JSON.stringify(children).includes('"text"')
}

/** Description paragraphs first, then whatever real prose the write-up already had. */
function merge(description: unknown, content: unknown): unknown {
  const descText = typeof description === 'string' ? description.trim() : ''
  const descParagraphs = descText ? paragraphsFromPlainText(descText) : []
  const existingChildren = hasProseLexical(content) ? (content as any).root.children : []
  const children = [...descParagraphs, ...existingChildren]
  if (children.length === 0) return content ?? null

  const existingRoot = hasProseLexical(content) ? (content as any).root : undefined
  return {
    root: {
      type: 'root',
      format: existingRoot?.format ?? '',
      indent: existingRoot?.indent ?? 0,
      version: 1,
      direction: existingRoot?.direction ?? null,
      children,
    },
  }
}

const payload = await getPayload({ config })

// ── Pass 1: read everything and write the backup file, before any write ────
type PendingUpdate = {
  slug: string
  bodyField: string
  id: string
  mergedEn: unknown
  mergedAr: unknown
}

const backup: Record<string, unknown[]> = {}
const pending: PendingUpdate[] = []

for (const { slug, bodyField } of TARGETS) {
  const bodyFieldAr = `${bodyField}Ar`
  const { docs } = await payload.find({
    collection: slug as any,
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })

  backup[slug] = []

  for (const doc of docs as any[]) {
    const hasDescription =
      (typeof doc.description === 'string' && doc.description.trim()) ||
      (typeof doc.descriptionAr === 'string' && doc.descriptionAr.trim())

    if (!hasDescription) continue

    backup[slug].push({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      descriptionAr: doc.descriptionAr,
      [bodyField]: doc[bodyField],
      [bodyFieldAr]: doc[bodyFieldAr],
    })

    pending.push({
      slug,
      bodyField,
      id: doc.id,
      mergedEn: merge(doc.description, doc[bodyField]),
      mergedAr: merge(doc.descriptionAr, doc[bodyFieldAr]),
    })
  }
}

fs.mkdirSync(BACKUP_DIR, { recursive: true })
const backupPath = path.join(
  BACKUP_DIR,
  `payload-description-content-merge-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
)
fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
console.log(`Backup of ${pending.length} documents about to be touched written to:\n  ${backupPath}\n`)

// ── Pass 2: the backup is safely on disk -- now write the merged values ────
const updatedPerCollection: Record<string, number> = {}

for (const { slug, bodyField, id, mergedEn, mergedAr } of pending) {
  const bodyFieldAr = `${bodyField}Ar`
  await payload.update({
    collection: slug as any,
    id,
    overrideAccess: true,
    data: {
      [bodyField]: mergedEn,
      [bodyFieldAr]: mergedAr,
      description: '',
      descriptionAr: '',
    } as any,
  })
  updatedPerCollection[slug] = (updatedPerCollection[slug] ?? 0) + 1
}

for (const { slug } of TARGETS) {
  console.log(`${slug}: ${updatedPerCollection[slug] ?? 0} merged`)
}
console.log(`\nTotal: ${pending.length} documents merged.`)

process.exit(0)
