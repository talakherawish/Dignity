/**
 * Resolves + validates the GitHub storage configuration.
 *
 * WHY THIS EXISTS — the 2026-07-26 "all downloads return 500" incident:
 *
 * The cloud storage plugin used to be wired up as
 * `enabled: Boolean(process.env.GITHUB_TOKEN)`. When that token was missing
 * the plugin silently switched off, and Payload fell back to writing uploads
 * to the local filesystem. On Vercel that filesystem is ephemeral — it is
 * wiped between deployments and can vanish between invocations — so:
 *
 *   - every uploaded file's bytes were lost shortly after upload,
 *   - the Media documents survived in MongoDB pointing at files that no
 *     longer existed,
 *   - and every download (`/api/media/file/…`) answered
 *     `500 {"errors":[{"message":"Something went wrong."}]}` — for images as
 *     well as PDFs — while PDF page-1 thumbnails could never be generated
 *     or served either.
 *
 * The failure was invisible: uploads *appeared* to succeed in the admin
 * panel, and nothing anywhere said "storage is not configured". This module
 * makes that state impossible to miss.
 *
 * Rules:
 *  - All required vars present  -> storage enabled, nothing logged.
 *  - Some present, some missing -> throw. A half-configured adapter is always
 *    a deployment mistake, and failing fast beats silently losing files.
 *  - None present               -> storage disabled. Loud error-level banner in
 *    production (uploads WILL be lost there); a short informational note in
 *    development, where the local disk is durable enough for testing.
 */

export type GithubStorageSettings = {
  token: string
  owner: string
  repo: string
  branch: string
  uploadsPath: string
}

export type ResolvedStorageConfig =
  | { enabled: true; settings: GithubStorageSettings }
  | { enabled: false; settings: null }

/** Vars without which the adapter cannot address a repo at all. */
const REQUIRED_VARS = ['GITHUB_TOKEN', 'GITHUB_REPO_OWNER', 'GITHUB_REPO_NAME'] as const

const BANNER = '='.repeat(72)

export function resolveGithubStorageConfig(env: NodeJS.ProcessEnv = process.env): ResolvedStorageConfig {
  const present = REQUIRED_VARS.filter((name) => {
    const value = env[name]
    return typeof value === 'string' && value.trim() !== ''
  })

  // Fully configured — the normal, healthy path.
  if (present.length === REQUIRED_VARS.length) {
    return {
      enabled: true,
      settings: {
        token: env.GITHUB_TOKEN as string,
        owner: env.GITHUB_REPO_OWNER as string,
        repo: env.GITHUB_REPO_NAME as string,
        branch: env.GITHUB_REPO_BRANCH?.trim() || 'main',
        uploadsPath: env.GITHUB_UPLOADS_PATH?.trim() || 'public/uploads',
      },
    }
  }

  // Partially configured — unambiguously a mistake; fail fast and say exactly
  // which variables are missing.
  if (present.length > 0) {
    const missing = REQUIRED_VARS.filter((name) => !present.includes(name))
    throw new Error(
      `GitHub file storage is partially configured: ${present.join(', ')} set, but ${missing.join(', ')} missing. ` +
        `Set the missing variable(s), or unset all of ${REQUIRED_VARS.join(', ')} to run without durable file storage.`,
    )
  }

  // Not configured at all.
  if (env.NODE_ENV === 'production') {
    console.error(
      `\n${BANNER}\n` +
        `FILE STORAGE IS NOT CONFIGURED — UPLOADS WILL BE LOST.\n` +
        `${BANNER}\n` +
        `None of ${REQUIRED_VARS.join(', ')} are set, so uploads fall back to this\n` +
        `server's local filesystem, which is ephemeral in a serverless deployment.\n` +
        `Files will disappear and every /api/media/file/... request will fail with\n` +
        `500 "Something went wrong." — for images as well as PDFs.\n` +
        `Set the GitHub storage environment variables to fix this.\n` +
        `${BANNER}\n`,
    )
  } else {
    console.info(
      '[storage] GitHub storage not configured — uploads go to the local filesystem (fine for local development).',
    )
  }

  return { enabled: false, settings: null }
}
