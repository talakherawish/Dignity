/** Temporary, one-off: removes the dangling brochure id from "Protecting Workers Dignity". Delete after use. */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'research',
  where: { title: { equals: 'Protecting Workers Dignity' } },
  depth: 0,
  limit: 1,
  overrideAccess: true,
})
const research = docs[0]
if (!research) throw new Error('Research line not found')

const ids = ((research as unknown as Record<string, unknown>).relatedBrochures as string[]) ?? []
console.log(`relatedBrochures currently has ${ids.length} id(s).`)

const dangling: string[] = []
for (const id of ids) {
  try {
    await payload.findByID({ collection: 'brochures', id, depth: 0, overrideAccess: true })
  } catch {
    dangling.push(id)
  }
}

console.log(`Dangling id(s): ${JSON.stringify(dangling)}`)

if (dangling.length === 0) {
  console.log('Nothing to clean up.')
  process.exit(0)
}

const cleaned = ids.filter((id) => !dangling.includes(id))
await payload.update({
  collection: 'research',
  id: research.id,
  data: { relatedBrochures: cleaned },
  overrideAccess: true,
})

console.log(`Removed ${dangling.length} dangling id(s). relatedBrochures now has ${cleaned.length}.`)
process.exit(0)
