/**
 * Resolves + validates the SMTP configuration used to notify
 * Dignity@birzeit.edu when someone subscribes through the site footer (see
 * collections/Recipients.ts).
 *
 * Mirrors the fail-fast/fail-loud shape of resolveGithubStorageConfig: fully
 * configured runs silently, a half-set config throws (a partial SMTP setup
 * is always a mistake, not an intentional choice), and an unset config falls
 * back to Payload's own console adapter -- fine for local development, but
 * loud in production since it means the notification email is never
 * actually sent.
 */

export type SmtpSettings = {
  host: string
  port: number
  user: string
  pass: string
  fromAddress: string
  fromName: string
}

export type ResolvedEmailConfig = { enabled: true; settings: SmtpSettings } | { enabled: false; settings: null }

const REQUIRED_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] as const

const BANNER = '='.repeat(72)

export function resolveEmailConfig(env: NodeJS.ProcessEnv = process.env): ResolvedEmailConfig {
  const present = REQUIRED_VARS.filter((name) => {
    const value = env[name]
    return typeof value === 'string' && value.trim() !== ''
  })

  if (present.length === REQUIRED_VARS.length) {
    return {
      enabled: true,
      settings: {
        host: env.SMTP_HOST as string,
        port: Number(env.SMTP_PORT) || 587,
        user: env.SMTP_USER as string,
        pass: env.SMTP_PASS as string,
        fromAddress: env.SMTP_FROM_ADDRESS?.trim() || (env.SMTP_USER as string),
        fromName: env.SMTP_FROM_NAME?.trim() || 'Dignity Initiative',
      },
    }
  }

  if (present.length > 0) {
    const missing = REQUIRED_VARS.filter((name) => !present.includes(name))
    throw new Error(
      `SMTP email is partially configured: ${present.join(', ')} set, but ${missing.join(', ')} missing. ` +
        `Set the missing variable(s), or unset all of ${REQUIRED_VARS.join(', ')} to run without outgoing email.`,
    )
  }

  if (env.NODE_ENV === 'production') {
    console.error(
      `\n${BANNER}\n` +
        `EMAIL IS NOT CONFIGURED -- MAILING LIST SIGNUPS WILL NOT NOTIFY ANYONE.\n` +
        `${BANNER}\n` +
        `None of ${REQUIRED_VARS.join(', ')} are set, so new-subscriber notifications\n` +
        `to Dignity@birzeit.edu are only written to this server's console log.\n` +
        `Set the SMTP environment variables to fix this.\n` +
        `${BANNER}\n`,
    )
  } else {
    console.info('[email] SMTP not configured -- outgoing email is logged to the console (fine for local development).')
  }

  return { enabled: false, settings: null }
}
