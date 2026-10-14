/**
 * Deletes seven Media records whose files were lost: PDFs uploaded on
 * 2026-07-23, before uploads were stored on GitHub, when the server's own
 * disk -- since wiped -- held the files. Nothing on the site points at them;
 * the brochures were uploaded again on 26-31 July with new files. Checked
 * here once more before each delete, so a record that something does use is
 * left alone.
 *
 *   npm run payload -- run scripts/delete-lost-brochure-pdfs.ts -- --target production
 *
 * Run on 2026-10-14: all seven deleted. (That run checked with $where, which
 * Atlas refused, so the check found nothing; a full scan afterwards found only
 * the Collective Negotiations duplicate referenced, and only by an old version
 * of its brochure and by the retired publications collections -- nothing live.)
 */
const target = process.argv[process.argv.indexOf('--target') + 1]
if (target !== 'production') {
  console.error('Needs --target production.')
  process.exit(1)
}

const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
console.log(`Database "${payload.db.connection.name}"`)

const LOST = [
  '6a6200ce02b32e4bb11e434b', // Unionawareness-Flyer-Collective Negotiations.pdf
  '6a61ff2b02b32e4bb11e42ec', // مدة عقد العمل.pdf
  '6a61fef202b32e4bb11e42ad', // عمل المنازل.pdf
  '6a61fe6c02b32e4bb11e423a', // ذوي الاعاقة.pdf
  '6a61fb3502b32e4bb11e414b', // الحد الادنى للاجور.pdf
  '6a61faac02b32e4bb11e4112', // الاضراب.pdf
  '6a61f9b202b32e4bb11e40d3', // اجرائات السلامة.pdf
]

// Every collection's documents and versions, searched for the id, so a draft
// or an old version pointing at a record is found too. Read in full and
// searched here: Atlas's shared tiers refuse a `$where` query.
const db = payload.db.connection.db!
const everything: { collection: string; text: string }[] = []
for (const { name } of await db.listCollections().toArray()) {
  if (name === 'media' || name.startsWith('payload-')) continue
  for await (const d of db.collection(name).find({}))
    everything.push({ collection: name, text: JSON.stringify(d) })
}

for (const id of LOST) {
  const doc = await payload.findByID({ collection: 'media', id, depth: 0 }).catch(() => null)
  if (!doc) {
    console.log(`  already gone: ${id}`)
    continue
  }
  const users = [...new Set(everything.filter((d) => d.text.includes(id)).map((d) => d.collection))]
  if (users.length) {
    console.log(`  kept, used in ${users.join(', ')}: ${doc.filename}`)
    continue
  }
  await payload.delete({ collection: 'media', id })
  console.log(`  deleted: ${doc.filename}`)
}
console.log('Done.')
process.exit(0)

export {}
