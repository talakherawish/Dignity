/**
 * `npm run dev:sandbox`: the admin and API locally, on the "dignity-sandbox"
 * database instead of the live one -- same cluster, separate data, never read
 * by the live site. For trying imports and pages with test data (see
 * scripts/import-bibliography.ts --target sandbox) without touching production.
 *
 * The sandbox has no admin accounts of its own: the first visit to /admin asks
 * to create one.
 */
import { spawn } from 'child_process'
import dotenv from 'dotenv'

// The same files, in the same order of precedence, that `next dev` reads.
dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({ path: '.env', quiet: true })

const url = new URL(process.env.DATABASE_URL ?? '')
url.pathname = '/dignity-sandbox'
console.log(`Using database "dignity-sandbox" on ${url.host}`)

spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  // Set before Next starts, so its own .env loading leaves it alone.
  env: { ...process.env, DATABASE_URL: url.toString() },
}).on('exit', (code) => process.exit(code ?? 0))
