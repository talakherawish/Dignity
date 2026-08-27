import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { createGithubStorageAdapter } from './lib/githubStorageAdapter'
import { enforceBilingual, enforceBilingualGlobal } from './lib/bilingual'
import { resolveGithubStorageConfig } from './lib/storageConfig'
import { resolveEmailConfig } from './lib/emailConfig'

// Resolved once at config load so a missing/half-set storage configuration is
// reported immediately and loudly, rather than silently degrading to the
// ephemeral local filesystem (which is what destroyed every previously
// uploaded file). See src/lib/storageConfig.ts.
const storage = resolveGithubStorageConfig()

// Same fail-fast treatment for the SMTP settings the Recipients collection
// uses to notify Dignity@birzeit.edu of new mailing-list signups. See
// src/lib/emailConfig.ts.
const email = resolveEmailConfig()

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Recipients } from './collections/Recipients'
import { DignityResearchInitiative, Partners } from './collections/AboutPages'
import { Participants } from './collections/Participants'
import { News } from './collections/News'
import { Photos } from './collections/Photos'
import { Clippings } from './collections/Clippings'
import { Research } from './collections/Research'
import { Forums } from './collections/Forums'
import { WindsorDignity } from './collections/WindsorDignity'
import {
  Books,
  Papers,
  Reports,
  Brochures,
  Theses,
  Audiovisual,
  Posters,
} from './collections/Publications'
import { ReadingsAndDocuments, Databases } from './collections/Information'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // The order below is the order of the admin sidebar, and it deliberately
  // mirrors the website's own header: a group appears where its first
  // collection appears, and collections appear within a group in this order.
  // (Payload has no per-collection ordering setting — an `admin.position` key
  // is silently ignored — so this array is the single place the sidebar is
  // arranged, and it should be kept in step with src/components/SiteHeader.tsx
  // in the frontend.)
  //
  // Every collection is wrapped in enforceBilingual() so that any English /
  // Arabic field pair (title/titleAr, body/bodyAr, …) must be filled in both
  // languages before a document can be published — see src/lib/bilingual.ts.
  // Wrapping centrally means new collections are covered automatically.
  collections: [
    // Admin
    Users,
    Media,
    Recipients,

    // About the Dignity Initiative
    DignityResearchInitiative,
    Participants,
    News,
    Photos,
    Clippings,
    Partners,

    // Activities
    Research,
    // Seminars, Conferences, and Meetings were merged into this one
    // collection -- see scripts/merge-seminars-conferences-meetings-into-forums.ts.
    // The three old collections' raw data still exists in MongoDB under
    // their old names; nothing was deleted, just no longer wired in here.
    Forums,
    WindsorDignity,

    // Publications
    Books,
    Papers,
    Reports,
    Brochures,
    Theses,
    Audiovisual,
    Posters,

    // Information
    ReadingsAndDocuments,
    Databases,
  ].map(enforceBilingual),
  globals: [SiteSettings].map(enforceBilingualGlobal),
  editor: lexicalEditor(),
  cors: process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['http://localhost:8080', 'http://localhost:3000'],
  csrf: process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['http://localhost:8080', 'http://localhost:3000'],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  email: email.enabled
    ? nodemailerAdapter({
        defaultFromAddress: email.settings.fromAddress,
        defaultFromName: email.settings.fromName,
        transportOptions: {
          host: email.settings.host,
          port: email.settings.port,
          auth: {
            user: email.settings.user,
            pass: email.settings.pass,
          },
        },
      })
    : undefined,
  sharp,
  plugins: [
    // Files uploaded through Payload's admin (photos, clippings, PDFs, etc)
    // are committed straight to this GitHub repo and served from
    // raw.githubusercontent.com — no paid storage service required. See
    // src/lib/githubStorageAdapter.ts for the full explanation and the
    // required GITHUB_* environment variables.
    cloudStoragePlugin({
      enabled: storage.enabled,
      collections: {
        media: {
          adapter: createGithubStorageAdapter({
            token: storage.settings?.token ?? '',
            owner: storage.settings?.owner ?? '',
            repo: storage.settings?.repo ?? '',
            branch: storage.settings?.branch ?? 'main',
            uploadsPath: storage.settings?.uploadsPath ?? 'public/uploads',
          }),
          disablePayloadAccessControl: true,
        },
      },
    }),
  ],
})
