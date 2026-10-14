import { getPayload } from 'payload'
import config from '@payload-config'
import sharp from 'sharp'

import { buildRawUrl, buildRepoPath, githubApiRequest } from '@/lib/githubStorageAdapter'
import { IMAGE_SIZE_WIDTHS, RESIZABLE_MIME_TYPES, WEBP_QUALITY } from '@/lib/imageSizes'
import { resolveGithubStorageConfig } from '@/lib/storageConfig'

// One-time maintenance tool, the same kind as ../backfill-thumbnails: Payload
// makes the smaller copies in src/lib/imageSizes.ts for every image uploaded
// from now on, but never goes back for the ones already there. This route
// does, for every image that has no copies yet, naming and encoding them
// exactly as Payload would. Originals are only read, never changed.
//
// Open it in the browser while logged in to the admin:
//   https://<site>/api/backfill-image-sizes
// It does a few images per visit (a 1 GB server resizing 5 MB PNGs, and the
// nginx 300 s timeout) and reloads itself until none are left. Safe to stop
// and re-open at any point: it always picks up whatever still has no copies,
// and once nothing is left it does nothing.
//
// Each batch is saved to GitHub as ONE commit through the Git Data API rather
// than one Contents API call per file like the live adapter: about 400 files
// one at a time would trip GitHub's secondary rate limit and queue a deploy
// per commit.

const BATCH_SIZE = 6

type SizeData = {
  filename: string | null
  width: number | null
  height: number | null
  mimeType: string | null
  filesize: number | null
}

type MediaRow = {
  _id: unknown
  filename?: string
  mimeType?: string
}

const NULL_SIZE: SizeData = { filename: null, width: null, height: null, mimeType: null, filesize: null }

function page(title: string, body: string, refresh: boolean): Response {
  const html = `<!doctype html><meta charset="utf-8">${refresh ? '<meta http-equiv="refresh" content="1">' : ''}
<title>${title}</title><body style="font:15px/1.5 system-ui;max-width:46rem;margin:2rem auto;padding:0 1rem">
<h1 style="font-size:1.3rem">${title}</h1>${body}</body>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export async function GET(request: Request) {
  const payload = await getPayload({ config: await config })

  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return page('Log in first', '<p>Log in to the admin panel in this browser, then open this page again.</p>', false)
  }

  const storage = resolveGithubStorageConfig()
  if (!storage.enabled) {
    return page('GitHub storage is not configured', '<p>Nothing to write the copies to.</p>', false)
  }
  const { token, owner, repo, branch, uploadsPath } = storage.settings
  const api = `https://api.github.com/repos/${owner}/${repo}`

  const media = payload.db.collections['media']!.collection
  const pending = (await media
    .find(
      { mimeType: { $in: RESIZABLE_MIME_TYPES }, 'sizes.small': { $exists: false } },
      { projection: { filename: 1, mimeType: 1 } },
    )
    .toArray()) as MediaRow[]

  if (pending.length === 0) {
    return page('All done', '<p>Every image has its smaller copies. This page has nothing left to do.</p>', false)
  }

  const batch = pending.slice(0, BATCH_SIZE)
  const blobs: { path: string; sha: string }[] = []
  const updates: { id: unknown; sizes: Record<string, SizeData> }[] = []
  const lines: string[] = []

  for (const doc of batch) {
    const filename = doc.filename ?? ''
    try {
      const source = await fetch(buildRawUrl(owner, repo, branch, buildRepoPath(uploadsPath, filename)))
      if (!source.ok) throw new Error(`fetching the original returned ${source.status}`)
      const original = Buffer.from(await source.arrayBuffer())
      const { width: originalWidth = 0 } = await sharp(original).rotate().metadata()

      const base = filename.replace(/\.[^.]+$/, '')
      const sizes: Record<string, SizeData> = {}

      for (const [name, width] of Object.entries(IMAGE_SIZE_WIDTHS)) {
        // Never enlarge -- the same rule Payload applies to new uploads.
        if (!originalWidth || originalWidth < width) {
          sizes[name] = NULL_SIZE
          continue
        }
        const { data, info } = await sharp(original)
          .rotate()
          .resize({ width })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer({ resolveWithObject: true })
        const sizeFilename = `${base}-${info.width}x${info.height}.webp`

        const blobRes = await githubApiRequest(
          `${api}/git/blobs`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: data.toString('base64'), encoding: 'base64' }),
          },
          token,
        )
        if (!blobRes.ok) throw new Error(`GitHub blob upload returned ${blobRes.status}`)
        const { sha } = (await blobRes.json()) as { sha: string }

        blobs.push({ path: buildRepoPath(uploadsPath, sizeFilename), sha })
        sizes[name] = {
          filename: sizeFilename,
          width: info.width,
          height: info.height,
          mimeType: 'image/webp',
          filesize: data.length,
        }
      }

      updates.push({ id: doc._id, sizes })
      const made = Object.values(sizes).filter((s) => s.filename)
      lines.push(
        `<li>${escapeHtml(filename)} — ${made.length ? made.map((s) => `${s.width}px ${Math.round(s.filesize! / 1024)} KB`).join(', ') : 'already small, no copies needed'}</li>`,
      )
    } catch (error) {
      lines.push(
        `<li style="color:#b00">${escapeHtml(filename)} — failed: ${escapeHtml(error instanceof Error ? error.message : String(error))}</li>`,
      )
    }
  }

  if (blobs.length > 0) {
    // Commit every file from this batch at once. If the branch moved while we
    // worked (an editor uploading, a push), rebuild on the new tip and retry.
    let committed = false
    for (let attempt = 0; attempt < 3 && !committed; attempt++) {
      const refRes = await githubApiRequest(`${api}/git/ref/heads/${branch}`, { method: 'GET' }, token)
      const parent = ((await refRes.json()) as { object: { sha: string } }).object.sha
      const commitInfo = (await (
        await githubApiRequest(`${api}/git/commits/${parent}`, { method: 'GET' }, token)
      ).json()) as { tree: { sha: string } }

      const treeRes = await githubApiRequest(
        `${api}/git/trees`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base_tree: commitInfo.tree.sha,
            tree: blobs.map((b) => ({ path: b.path, mode: '100644', type: 'blob', sha: b.sha })),
          }),
        },
        token,
      )
      if (!treeRes.ok) throw new Error(`GitHub tree creation returned ${treeRes.status}`)
      const tree = ((await treeRes.json()) as { sha: string }).sha

      const commitRes = await githubApiRequest(
        `${api}/git/commits`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Add smaller image copies for ${updates.length} uploads`,
            tree,
            parents: [parent],
          }),
        },
        token,
      )
      if (!commitRes.ok) throw new Error(`GitHub commit returned ${commitRes.status}`)
      const commit = ((await commitRes.json()) as { sha: string }).sha

      const moveRes = await githubApiRequest(
        `${api}/git/refs/heads/${branch}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sha: commit, force: false }),
        },
        token,
      )
      committed = moveRes.ok
    }
    if (!committed) {
      return page(
        'Could not save to GitHub',
        '<p>The branch kept moving while saving. Nothing was recorded; reload to try again.</p>',
        false,
      )
    }
  }

  // Only now that the files exist in the repo do the records point at them.
  for (const { id, sizes } of updates) {
    await media.updateOne({ _id: id } as never, { $set: { sizes } })
  }

  const remaining = pending.length - updates.length
  const failed = batch.length - updates.length
  // A failure stops the self-reloading: the same image would come up first
  // again and fail again, forever. The error stays on screen instead.
  if (failed > 0) {
    return page(
      `Stopped — ${failed} image(s) failed`,
      `<ul>${lines.join('')}</ul><p>${remaining} images still need copies. Reload to try again.</p>`,
      false,
    )
  }
  return page(
    remaining > 0 ? `Working… ${remaining} images left` : 'Finished',
    `<ul>${lines.join('')}</ul>` +
      (remaining > 0 ? '<p>This page reloads itself. Leave it open until it says Finished.</p>' : ''),
    remaining > 0,
  )
}
