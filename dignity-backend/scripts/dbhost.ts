import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })
console.log('host:', payload.db.connection.host)
console.log('database:', payload.db.connection.name)
process.exit(0)
