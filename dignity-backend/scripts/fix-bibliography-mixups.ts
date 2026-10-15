/**
 * Fixes two entries in the Human Dignity bibliography whose details belonged
 * to other entries:
 *
 *   - The annotation on Lindner's "A Dignity Economy" describes Bonefeld and
 *     Psychopedis's "Human Dignity: Social Autonomy and the Critique of
 *     Capitalism". It was pasted there on 2026-10-13 already missing its first
 *     words; no saved version has them. It moves to the Bonefeld entry, opening
 *     "This volume, edited by" so the sentence reads.
 *   - Raheb's "Decolonizing Palestine" came in from the sheet on 2026-10-08
 *     with the editors of "Dignity and the Organization" (Kostera, Pirson) and a
 *     Harvard University Press link to another book. Both are removed, and the
 *     entry shows as a citation until someone adds its real link.
 *
 *   npm run payload -- run scripts/fix-bibliography-mixups.ts -- --target production
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

const LINDNER = '6ac735767b6428df5c5dca1e'
const BONEFELD = '6ac735357b6428df5c5dc5f4'
const RAHEB = '6ac7355a7b6428df5c5dc870'

const lindner = await payload.findByID({ collection: 'bibliography-entries', id: LINDNER, depth: 0 })
const annotation = lindner.annotation?.trim() ?? ''
if (annotation.startsWith('Werner Bonefeld and Kosmas Psychopedis, brings together')) {
  await payload.update({
    collection: 'bibliography-entries',
    id: BONEFELD,
    data: { annotation: `This volume, edited by ${annotation}`, _status: 'published' },
  })
  await payload.update({
    collection: 'bibliography-entries',
    id: LINDNER,
    data: { annotation: '', _status: 'published' },
  })
  console.log('  annotation moved from Lindner to Bonefeld/Psychopedis')
} else {
  console.log('  Lindner annotation not the misplaced one -- left alone')
}

const raheb = await payload.findByID({ collection: 'bibliography-entries', id: RAHEB, depth: 0 })
if (raheb.url === 'https://www.hup.harvard.edu/books/9780674984059') {
  await payload.update({
    collection: 'bibliography-entries',
    id: RAHEB,
    data: { editors: [], url: '', access: 'citation', _status: 'published' },
  })
  console.log('  Raheb: wrong editors and link removed')
} else {
  console.log('  Raheb link already changed -- left alone')
}
process.exit(0)
