/**
 * Verification harness for src/lib/bilingual.ts.
 *
 * Runs the REAL enforceBilingual() over the REAL collections and asserts that
 * single-language input is rejected while complete/empty input is accepted.
 *
 *   npx tsx scripts/verify-bilingual.ts
 */
import type { CollectionConfig, Field } from 'payload'
import { enforceBilingual } from '../src/lib/bilingual'
import { News } from '../src/collections/News'
import { DignityResearchInitiative } from '../src/collections/AboutPages'
import { Participants } from '../src/collections/Participants'
import { Books } from '../src/collections/Publications'
import { Seminars } from '../src/collections/Seminars'

let failures = 0
const ok = (name: string) => console.log(`  PASS  ${name}`)
const bad = (name: string, detail: string) => { failures++; console.log(`  FAIL  ${name}\n        ${detail}`) }

type ValidateFn = (v: unknown, o: Record<string, unknown>) => unknown

const findField = (fields: Field[], name: string): Field | undefined =>
  fields.find((f) => (f as { name?: string }).name === name)

const lex = (text: string) => ({
  root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
    children: [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0,
      children: [{ type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }] }] },
})
const lexEmpty = () => ({
  root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
    children: [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [] }] },
})

async function run(
  collection: CollectionConfig,
  fieldName: string,
  value: unknown,
  siblingData: Record<string, unknown>,
  status: 'published' | 'draft' = 'published',
) {
  const patched = enforceBilingual(collection)
  const field = findField(patched.fields, fieldName)
  if (!field) throw new Error(`no field ${fieldName} in ${collection.slug}`)
  const validate = (field as { validate?: ValidateFn }).validate
  if (typeof validate !== 'function') return { noValidator: true, result: undefined as unknown }
  const result = await validate(value, { siblingData, data: { ...siblingData, _status: status } })
  return { noValidator: false, result }
}

async function expectReject(label: string, c: CollectionConfig, f: string, v: unknown, sib: Record<string, unknown>) {
  const { noValidator, result } = await run(c, f, v, sib)
  if (noValidator) return bad(label, `no validator attached to ${c.slug}.${f}`)
  if (result === true) return bad(label, 'expected rejection, got accepted')
  ok(`${label} -> rejected: "${String(result).slice(0, 70)}…"`)
}

async function expectAccept(label: string, c: CollectionConfig, f: string, v: unknown, sib: Record<string, unknown>, status: 'published' | 'draft' = 'published') {
  const { noValidator, result } = await run(c, f, v, sib, status)
  if (noValidator) return bad(label, `no validator attached to ${c.slug}.${f}`)
  if (result !== true) return bad(label, `expected acceptance, got: ${String(result)}`)
  ok(`${label} -> accepted`)
}

async function main() {
  console.log('\n— English filled, Arabic empty (must be REJECTED) —')
  await expectReject('News.titleAr empty w/ title set', News, 'titleAr', '', { title: 'Hello' })
  await expectReject('Seminars.descriptionAr empty w/ description set', Seminars, 'descriptionAr', lexEmpty(), { description: lex('Some text') })
  await expectReject('Participants.nameAr empty w/ name set', Participants, 'nameAr', undefined, { name: 'Jane Doe' })
  await expectReject('Books.authorAr empty w/ author set', Books, 'authorAr', '   ', { author: 'A. Author' })
  await expectReject('DignityResearchInitiative.bodyAr empty w/ body set', DignityResearchInitiative, 'bodyAr', lexEmpty(), { body: lex('Body copy') })

  console.log('\n— Arabic filled, English empty (must also be REJECTED) —')
  await expectReject('News.title empty w/ titleAr set', News, 'title', '', { titleAr: 'مرحبا' })
  await expectReject('DignityResearchInitiative.description empty w/ descriptionAr set', DignityResearchInitiative, 'description', '', { descriptionAr: 'وصف' })
  await expectReject('Seminars.content empty w/ contentAr set', Seminars, 'content', lexEmpty(), { contentAr: lex('محتوى') })

  console.log('\n— Both languages present (must be ACCEPTED) —')
  await expectAccept('News.titleAr filled w/ title', News, 'titleAr', 'مرحبا', { title: 'Hello' })
  await expectAccept('Seminars.descriptionAr filled', Seminars, 'descriptionAr', lex('وصف'), { description: lex('desc') })
  await expectAccept('DignityResearchInitiative.bodyAr filled', DignityResearchInitiative, 'bodyAr', lex('نص'), { body: lex('text') })

  console.log('\n— Both empty on an OPTIONAL pair (must be ACCEPTED: optional stays optional) —')
  await expectAccept('Books.authorAr both empty', Books, 'authorAr', '', { author: '' })
  await expectAccept('DignityResearchInitiative.descriptionAr both empty', DignityResearchInitiative, 'descriptionAr', undefined, {})

  console.log('\n— Draft exemption (half-translated DRAFT may be saved) —')
  await expectAccept('News.titleAr empty on draft', News, 'titleAr', '', { title: 'Hello' }, 'draft')

  console.log('\n— required mirrored EN -> AR —')
  for (const [c, en, ar] of [
    [News, 'title', 'titleAr'], [Seminars, 'title', 'titleAr'],
    [Participants, 'name', 'nameAr'], [Books, 'title', 'titleAr'],
  ] as [CollectionConfig, string, string][]) {
    const patched = enforceBilingual(c)
    const enF = findField(patched.fields, en) as { required?: boolean }
    const arF = findField(patched.fields, ar) as { required?: boolean }
    if (enF?.required && arF?.required) ok(`${c.slug}: ${ar} required mirrored from ${en}`)
    else bad(`${c.slug}: ${ar} required mirror`, `en.required=${enF?.required} ar.required=${arF?.required}`)
  }

  console.log(failures === 0 ? '\nALL PASS ✅' : `\n${failures} FAILURE(S) ❌`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
