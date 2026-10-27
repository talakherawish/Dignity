import type { CollectionConfig, Field, FieldHook, Validate } from 'payload'
import {
  BoldFeature,
  InlineToolbarFeature,
  ItalicFeature,
  ParagraphFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * Bold and italic in titles and short texts (a title, a summary, a role, a
 * caption), chosen by the editor the same way as in a write-up.
 *
 * Each such field keeps its plain-text value -- `title` / `titleAr` -- which
 * the admin's lists, search, relationship pickers, slugs and imports go on
 * using unchanged. Beside it sits a one-line editor with only Bold and Italic
 * -- `titleRich` / `titleRichAr` -- which is what editors see and type into.
 * The plain value is worked out from it on every save, so the two never
 * disagree. An entry saved before the editor existed shows its plain text in
 * the editor (see fromPlain), so nothing has to be typed in again.
 *
 * The website shows the formatted version and falls back to the plain one.
 */

// The same floating toolbar as the write-ups: select words and Bold / Italic
// appear above them. No fixed bar across the top of a one-line field.
const inlineEditor = lexicalEditor({
  features: [ParagraphFeature(), BoldFeature(), ItalicFeature(), InlineToolbarFeature()],
})

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] }
type LexicalState = { root?: LexicalNode }

const node = (type: string, extra: object) => ({
  type,
  format: '',
  indent: 0,
  version: 1,
  direction: null,
  ...extra,
})

/** Plain text as editor content: one paragraph per line, no formatting. */
function fromPlain(text: string): LexicalState {
  return {
    root: node('root', {
      children: text.split('\n').map((line) =>
        node('paragraph', {
          textFormat: 0,
          textStyle: '',
          children: line
            ? [{ type: 'text', text: line, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }]
            : [],
        }),
      ),
    }),
  } as LexicalState
}

/** Editor content as plain text: paragraphs become lines, formatting is dropped. */
function toPlain(state: LexicalState): string {
  const inline = (n: LexicalNode): string =>
    n.type === 'text' ? (n.text ?? '') : n.type === 'linebreak' ? '\n' : (n.children ?? []).map(inline).join('')
  return (state.root?.children ?? []).map(inline).join('\n').trim()
}

const isState = (value: unknown): value is LexicalState =>
  !!value && typeof value === 'object' && 'root' in value

/** The plain field: worked out from the editor's content whenever that is sent. */
const derivePlain =
  (richName: string): FieldHook =>
  ({ value, siblingData }) => {
    if (!siblingData || !(richName in siblingData)) return value
    const rich = siblingData[richName]
    return isState(rich) ? toPlain(rich) || null : null
  }

/** The editor: an entry saved before it existed shows its plain text in it. */
const fillFromPlain =
  (plainName: string): FieldHook =>
  ({ value, siblingData }) => {
    if (isState(value) && toPlain(value)) return value
    const plain = siblingData?.[plainName]
    return typeof plain === 'string' && plain.trim() ? fromPlain(plain) : value
  }

type Named = Field & { name: string; required?: boolean; label?: unknown; admin?: Record<string, unknown> }

/**
 * "Required" for the editor, checked on save rather than declared: declaring
 * it would make every bit of code that creates an entry with only a plain
 * title (the imports) supply editor content too. Drafts skip it, as they do
 * every required field.
 */
const requireContent =
  (plainName: string): Validate =>
  (value, { siblingData }) => {
    if (isState(value) && toPlain(value)) return true
    // Code that saves only the plain text (an import) leaves the editor empty;
    // the plain text is what counts then. It was already worked out from the
    // editor by derivePlain when the editor was sent, empty or not.
    const plain = (siblingData as Record<string, unknown> | undefined)?.[plainName]
    return typeof plain === 'string' && plain.trim() ? true : 'This field is required.'
  }

/** One plain field becomes the hidden plain field plus its formatting editor. */
function formatted(field: Named, required: boolean): Field[] {
  const isArabic = field.name.endsWith('Ar')
  const base = isArabic ? field.name.slice(0, -2) : field.name
  const richName = `${base}Rich${isArabic ? 'Ar' : ''}`
  return [
    {
      ...field,
      admin: { ...field.admin, condition: () => false },
      hooks: { beforeValidate: [derivePlain(richName)] },
    } as Field,
    {
      name: richName,
      type: 'richText',
      label: field.label,
      validate: required ? requireContent(field.name) : undefined,
      editor: inlineEditor,
      // Laid out beside its other-language twin -- see adminLayout.
      custom: { inline: true },
      admin: { description: field.admin?.description, rtl: field.admin?.rtl },
      hooks: { afterRead: [fillFromPlain(field.name)] },
    } as Field,
  ]
}

/**
 * Gives bold and italic to the named fields and their Arabic twins: `title`
 * for a top-level field, `gallery.caption` for one inside an array.
 */
function withFormatting(fields: Field[], names: string[], path = ''): Field[] {
  // A required English title makes its Arabic twin required too, as
  // enforceBilingual does for the plain pair.
  const requiredNames = new Set(
    fields.filter((f) => (f as Named).required).map((f) => (f as Named).name),
  )
  const converted = fields.flatMap((field) => {
    const named = field as Named
    const container = field as { fields?: Field[]; tabs?: { fields: Field[] }[] }
    if (named.name) {
      const own = path + named.name
      const isArabic = own.endsWith('Ar')
      const base = isArabic ? own.slice(0, -2) : own
      if (names.includes(base) && (field.type === 'text' || field.type === 'textarea')) {
        const english = isArabic ? named.name.slice(0, -2) : named.name
        return formatted(named, requiredNames.has(english))
      }
    }
    // Sections and rows hold no data, so their fields keep the same path;
    // arrays and groups add their own name to it.
    const inner = named.name && field.type !== 'row' && field.type !== 'collapsible' ? `${path}${named.name}.` : path
    if (Array.isArray(container.fields)) {
      return [{ ...field, fields: withFormatting(container.fields, names, inner) } as Field]
    }
    if (Array.isArray(container.tabs)) {
      return [
        {
          ...field,
          tabs: container.tabs.map((tab) => ({ ...tab, fields: withFormatting(tab.fields, names, path) })),
        } as Field,
      ]
    }
    return [field]
  })
  // [title, titleRich, titleAr, titleRichAr] -> [title, titleAr, titleRich,
  // titleRichAr]: the two editors next to each other, so they pair up side by
  // side. The plain fields are hidden, so where they sit doesn't show.
  for (let i = 0; i + 3 < converted.length; i++) {
    const [a, b, c, d] = converted.slice(i, i + 4) as Named[]
    if (b.name === `${a.name}Rich` && c.name === `${a.name}Ar` && d.name === `${a.name}RichAr`) {
      converted.splice(i, 4, a, c, b, d)
      i += 3
    }
  }
  return converted
}

/** Which fields get bold and italic, by collection. */
const FORMATTED: Record<string, string[]> = {
  news: ['title', 'excerpt'],
  forums: ['title', 'gallery.caption'],
  books: ['title', 'description'],
  papers: ['title', 'description'],
  reports: ['title', 'description'],
  brochures: ['title', 'description'],
  theses: ['title', 'description'],
  audiovisual: ['title', 'description'],
  posters: ['title', 'description'],
  research: ['title'],
  'task-force-ai': ['title'],
  'idea-factory': ['title'],
  'windsor-birzeit': ['title'],
  photos: ['title'],
  clippings: ['title'],
  stickers: ['title'],
  'about-initiative': ['title'],
  disclaimer: ['title'],
  'privacy-policy': ['title'],
  'reading-lists': ['title'],
  databases: ['title'],
  // The role line under a person's name.
  participants: ['title'],
}

export function withFormattedText(collection: CollectionConfig): CollectionConfig {
  const names = FORMATTED[collection.slug]
  return names ? { ...collection, fields: withFormatting(collection.fields, names) } : collection
}
