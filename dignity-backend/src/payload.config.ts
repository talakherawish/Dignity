import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { createGithubStorageAdapter } from './lib/githubStorageAdapter'
import { enforceBilingual, enforceBilingualGlobal } from './lib/bilingual'
import { resolveGithubStorageConfig } from './lib/storageConfig'

// Resolved once at config load so a missing/half-set storage configuration is
// reported immediately and loudly, rather than silently degrading to the
// ephemeral local filesystem (which is what destroyed every previously
// uploaded file). See src/lib/storageConfig.ts.
const storage = resolveGithubStorageConfig()

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { Activities } from './collections/Activities'
import { Announcements } from './collections/Announcements'
import { Photos } from './collections/Photos'
import { Clippings } from './collections/Clippings'
import { Participants } from './collections/Participants'
import { Publications } from './collections/Publications'
import { Information } from './collections/Information'
import { Pages } from './collections/Pages'
import { Research } from './collections/Research'
import { WindsorDignity } from './collections/WindsorDignity'
import { PublicationsCollection } from './collections/PublicationsCollection'
import { Seminars } from './collections/Seminars'
import { Conferences } from './collections/Conferences'
import { Meetings } from './collections/Meetings'
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
  // Every collection is wrapped in enforceBilingual() so that any English /
  // Arabic field pair (title/titleAr, body/bodyAr, …) must be filled in both
  // languages before a document can be published — see src/lib/bilingual.ts.
  // Wrapping centrally means new collections are covered automatically.
  collections: [Users, Participants, Activities, Seminars, Conferences, Meetings, WindsorDignity, PublicationsCollection, Publications, Information, News, Announcements, Photos, Clippings, Research, Media, Pages].map(enforceBilingual),
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
