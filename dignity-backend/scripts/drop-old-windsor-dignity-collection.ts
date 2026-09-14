/**
 * One-time cleanup: the old `windsor-dignity` collection (title + date +
 * content, no page-level heading) was replaced by `windsor-birzeit`, shaped
 * like Task Force on AI / Idea Factory (see ActivityLines.ts). The old
 * collection held exactly one stray, empty-except-for-title test document,
 * confirmed disposable -- this drops it and its versions collection from
 * MongoDB directly, since `windsor-dignity` is no longer in payload.config.ts
 * and so no longer reachable through the Local API.
 *
 *   npm run payload -- run scripts/drop-old-windsor-dignity-collection.ts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const db = payload.db.connection.db!

for (const name of ['windsor-dignity', '_windsor-dignity_versions']) {
  const exists = (await db.listCollections({ name }).toArray()).length > 0
  if (!exists) {
    console.log(`${name}: does not exist, nothing to drop`)
    continue
  }
  const count = await db.collection(name).countDocuments()
  await db.dropCollection(name)
  console.log(`${name}: dropped (${count} document${count === 1 ? '' : 's'})`)
}

process.exit(0)
