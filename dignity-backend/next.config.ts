import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
    output: 'standalone',
    images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // pdf-to-img (used for auto-generating PDF thumbnails, see
  // src/lib/pdfThumbnail.ts) pulls in pdfjs-dist -> @napi-rs/canvas, which
  // ships a native binary and does its own runtime path/platform detection.
  // Turbopack's static build-time bundler cannot analyze that safely and
  // throws "The 'path' argument must be of type string" while collecting
  // page data for /admin. Marking these external tells Turbopack to leave
  // them as plain runtime requires instead of trying to bundle them.
  serverExternalPackages: ['pdf-to-img', 'pdfjs-dist', '@napi-rs/canvas'],
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
