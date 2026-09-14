/**
 * Read-only: prints one sample document from each of the five collections
 * that hold a separate `description` + `content`/`body` pair, so the shapes
 * (plain textarea vs Lexical richText, empty-state representation) are known
 * before writing the merge migration.
 *
 *   npm run payload -- run scripts/inspect-description-content.ts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const targets: { slug: string; bodyField: string }[] = [
  { slug: 'about-initiative', bodyField: 'body' },
  { slug: 'partners', bodyField: 'body' },
  { slug: 'task-force-ai', bodyField: 'content' },
  { slug: 'idea-factory', bodyField: 'content' },
  { slug: 'research', bodyField: 'content' },
  { slug: 'forums', bodyField: 'content' },
  { slug: 'windsor-dignity', bodyField: 'content' },
]

for (const { slug, bodyField } of targets) {
  const { docs, totalDocs } = await payload.find({
    collection: slug as any,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  console.log(`\n=== ${slug} (${totalDocs} docs) ===`)
  const doc = docs[0] as any
  if (!doc) {
    console.log('(no documents)')
    continue
  }
  console.log('description:', JSON.stringify(doc.description))
  console.log(`${bodyField}:`, JSON.stringify(doc[bodyField])?.slice(0, 500))
}

process.exit(0)
