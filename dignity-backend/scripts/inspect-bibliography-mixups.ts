/**
 * Read-only: the Lindner, Bonefeld/Psychopedis and Raheb entries, with every
 * saved version of each, to see what their annotation, editors and link were
 * before they got mixed up.
 *
 *   npm run payload -- run scripts/inspect-bibliography-mixups.ts
 */
export {}

const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
console.log(`Database "${payload.db.connection.name}"`)

for (const title of ['A Dignity Economy', 'Human Dignity: Social Autonomy', 'Decolonizing Palestine']) {
  const { docs } = await payload.find({
    collection: 'bibliography-entries',
    where: { title: { like: title } },
    draft: true,
    depth: 0,
  })
  for (const doc of docs) {
    console.log(`\n== ${doc.id} ${doc.title}`)
    const versions = await payload.findVersions({
      collection: 'bibliography-entries',
      where: { parent: { equals: doc.id } },
      sort: 'createdAt',
      pagination: false,
      depth: 0,
    })
    for (const v of versions.docs) {
      const e = v.version as unknown as Record<string, unknown>
      console.log(
        `  ${v.createdAt} ${e._status}`,
        JSON.stringify({
          editors: e.editors,
          url: e.url,
          annotation: typeof e.annotation === 'string' ? e.annotation.slice(0, 120) : e.annotation,
          internalNote: e.internalNote,
        }),
      )
    }
  }
}
process.exit(0)
