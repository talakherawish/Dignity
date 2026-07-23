import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { createGithubStorageAdapter } from './lib/githubStorageAdapter'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Articles } from './collections/Articles'
import { Activities } from './collections/Activities'
import { Announcements } from './collections/Announcements'
import { Photos } from './collections/Photos'
import { Clippings } from './collections/Clippings'
import { Participants } from './collections/Participants'
import { Publications } from './collections/Publications'
import { Information } from './collections/Information'
import { ResearchActivities } from './collections/ResearchActivities'
import { Pages } from './collections/Pages'
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
  collections: [Users, Media, Articles, Activities, Announcements, Photos, Clippings, Participants, Publications, Information, ResearchActivities, Pages],
  globals: [SiteSettings],
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
      enabled: Boolean(process.env.GITHUB_TOKEN),
      collections: {
        media: {
          adapter: createGithubStorageAdapter({
            token: process.env.GITHUB_TOKEN || '',
            owner: process.env.GITHUB_REPO_OWNER || '',
            repo: process.env.GITHUB_REPO_NAME || '',
            branch: process.env.GITHUB_REPO_BRANCH || 'main',
            uploadsPath: process.env.GITHUB_UPLOADS_PATH || 'public/uploads',
          }),
          disablePayloadAccessControl: true,
        },
      },
    }),
  ],
})
