/**
 * Verification harness for src/lib/bilingual.ts.
 *
 * Runs the REAL enforceBilingual() over the REAL collections and asserts
 * that:
 *   - title is mandatory in both languages (required mirrors EN -> AR).
 *   - every other field pair is independent: no forced "fill one, fill both"
 *     coupling, and no leftover custom validator from the old behavior.
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
const bad = (name: string, detail: string) => {
  failures++
  console.log(`  FAIL  ${name}\n        ${detail}`)
}

const findField = (fields: Field[], name: string): Field | undefined =>
  fields.find((f) => (f as { name?: string }).name === name)

function expectRequired(label: string, c: CollectionConfig, enName: string, arName: string) {
  const patched = enforceBilingual(c)
  const enF = findField(patched.fields, enName) as { required?: boolean } | undefined
  const arF = findField(patched.fields, arName) as { required?: boolean } | undefined
  if (enF?.required && arF?.required) ok(label)
  else bad(label, `en.required=${enF?.required} ar.required=${arF?.required}`)
}

function expectIndependent(label: string, c: CollectionConfig, enName: string, arName: string) {
  const original = c.fields
  const patched = enforceBilingual(c)
  const enF = findField(patched.fields, enName) as { required?: boolean; validate?: unknown } | undefined
  const arF = findField(patched.fields, arName) as { required?: boolean; validate?: unknown } | undefined
  const originalArF = findField(original, arName) as { validate?: unknown } | undefined
  if (!enF || !arF) return bad(label, `missing field(s): ${enName}=${!!enF} ${arName}=${!!arF}`)
  // A field may carry its own domain validator (a word-count limit, say) —
  // that's unrelated to bilingual pairing and must be left untouched.
  // enforceBilingual must not have attached a *different* one of its own.
  if (arF.validate !== originalArF?.validate)
    return bad(label, 'enforceBilingual attached its own validator — the pair is not independent')
  if (arF.required) return bad(label, `${arName} is required despite ${enName} not being required`)
  ok(label)
}

async function main() {
  console.log('\n— Title required, mirrored EN -> AR —')
  expectRequired('News: titleAr required (mirrored from title)', News, 'title', 'titleAr')
  expectRequired('Seminars: titleAr required (mirrored from title)', Seminars, 'title', 'titleAr')
  expectRequired('Participants: nameAr required (mirrored from name)', Participants, 'name', 'nameAr')
  expectRequired('Books: titleAr required (mirrored from title)', Books, 'title', 'titleAr')
  // DignityResearchInitiative and Partners are standalone prose pages (see
  // AboutPages.ts), not itemized content — their title was never marked
  // required, so there's nothing for enforceBilingual to mirror. Not tested
  // here for that reason, not because the mirroring is skipped for them.

  console.log('\n— Every other pair is independent: no forced coupling, no custom validator —')
  expectIndependent('News: excerpt/excerptAr', News, 'excerpt', 'excerptAr')
  expectIndependent('News: content/contentAr', News, 'content', 'contentAr')
  expectIndependent('Seminars: description/descriptionAr', Seminars, 'description', 'descriptionAr')
  expectIndependent('Participants: bio/bioAr', Participants, 'bio', 'bioAr')
  expectIndependent('Books: author/authorAr', Books, 'author', 'authorAr')
  expectIndependent('Books: description/descriptionAr', Books, 'description', 'descriptionAr')
  expectIndependent(
    'DignityResearchInitiative: description/descriptionAr',
    DignityResearchInitiative,
    'description',
    'descriptionAr',
  )
  expectIndependent('DignityResearchInitiative: body/bodyAr', DignityResearchInitiative, 'body', 'bodyAr')

  console.log(failures === 0 ? '\nALL PASS ✅' : `\n${failures} FAILURE(S) ❌`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
